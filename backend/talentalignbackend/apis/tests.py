"""
tests.py
Comprehensive unit tests for Talent Align backend including:
- Data Engineering & Excel Automation Architecture (TalentAlignmentExcelReportGenerator)
- Enterprise Stream Normalization & Standardization (10 allowed streams)
- JD Source Tracking (Direct BU vs RMG)
- API endpoints for Excel Export and Transformation
"""

import io
import logging
import pandas as pd
import openpyxl
from django.test import TestCase, RequestFactory
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.http import HttpResponse
from .models import Job, UserInfo, ProfileRecord, Course, InterviewLock, Match, Strength
from .stream_constants import (
    ALLOWED_STREAMS,
    normalize_to_standard_stream,
    is_valid_stream
)
from .excel_generator import TalentAlignmentExcelReportGenerator
from .middleware import RequestLoggingMiddleware, get_client_ip

User = get_user_model()


class StreamNormalizationTests(TestCase):
    """Unit tests for the 10 allowed enterprise streams and normalizers."""

    def test_allowed_streams_count(self):
        self.assertEqual(len(ALLOWED_STREAMS), 10)
        expected_streams = [
            'AI Engineering', 'Angular', 'Devops', 'DotNet', 'PLSQL',
            'SpringBoot', 'Test Automation', 'Cloud', 'Cyber Security', 'Data Engineering'
        ]
        self.assertEqual(ALLOWED_STREAMS, expected_streams)

    def test_normalize_synonyms(self):
        # AI Engineering
        self.assertEqual(normalize_to_standard_stream('genai'), 'AI Engineering')
        self.assertEqual(normalize_to_standard_stream('Machine Learning'), 'AI Engineering')
        self.assertEqual(normalize_to_standard_stream('ai'), 'AI Engineering')

        # Angular
        self.assertEqual(normalize_to_standard_stream('angularjs'), 'Angular')
        self.assertEqual(normalize_to_standard_stream('Angular 2+'), 'Angular')

        # Devops
        self.assertEqual(normalize_to_standard_stream('ci/cd'), 'Devops')
        self.assertEqual(normalize_to_standard_stream('kubernetes'), 'Devops')

        # DotNet
        self.assertEqual(normalize_to_standard_stream('c#'), 'DotNet')
        self.assertEqual(normalize_to_standard_stream('.net core'), 'DotNet')
        self.assertEqual(normalize_to_standard_stream('asp.net'), 'DotNet')

        # PLSQL
        self.assertEqual(normalize_to_standard_stream('oracle plsql'), 'PLSQL')
        self.assertEqual(normalize_to_standard_stream('t-sql'), 'PLSQL')

        # SpringBoot
        self.assertEqual(normalize_to_standard_stream('java spring boot'), 'SpringBoot')
        self.assertEqual(normalize_to_standard_stream('spring framework'), 'SpringBoot')

        # Test Automation
        self.assertEqual(normalize_to_standard_stream('selenium'), 'Test Automation')
        self.assertEqual(normalize_to_standard_stream('qa automation'), 'Test Automation')

        # Cloud
        self.assertEqual(normalize_to_standard_stream('aws'), 'Cloud')
        self.assertEqual(normalize_to_standard_stream('azure'), 'Cloud')

        # Cyber Security
        self.assertEqual(normalize_to_standard_stream('infosec'), 'Cyber Security')
        self.assertEqual(normalize_to_standard_stream('penetration testing'), 'Cyber Security')

        # Data Engineering
        self.assertEqual(normalize_to_standard_stream('pyspark'), 'Data Engineering')
        self.assertEqual(normalize_to_standard_stream('etl pipeline'), 'Data Engineering')

    def test_normalize_fallback_others(self):
        self.assertEqual(normalize_to_standard_stream('Unknown Skill XYZ'), 'Others')
        self.assertEqual(normalize_to_standard_stream(''), 'Others')
        self.assertEqual(normalize_to_standard_stream(None), 'Others')


class ExcelGeneratorUnitTests(TestCase):
    """Unit tests for the TalentAlignmentExcelReportGenerator data engineering engine."""

    def setUp(self):
        # Sample raw dataset mimicking business data
        self.sample_records = [
            {
                'BG': 'CBG', 'ISU/HSU': 'Banking', 'Project Name': 'Core Banking System',
                'Stream': 'SpringBoot', 'Location': 'Hyderabad', 'Role': 'Developer',
                'Project SPOC Name': 'Alice Smith', 'Project SPOC Emp ID': 'EMP101',
                'RMG Head': 'Robert Brown', 'RGS ID': 'RGS-001', 'Demand Count': 10,
                'Shared By': 'Direct BU', 'Pending/Confirmed': 'Confirmed', 'Supply Completed': 8,
                'Batch': 'Batch-2026-A'
            },
            {
                'BG': 'Growth Markets', 'ISU/HSU': 'Insurance', 'Project Name': 'Claims Processing',
                'Stream': 'DotNet', 'Location': 'Bangalore', 'Role': 'Developer',
                'Project SPOC Name': 'Bob Jones', 'Project SPOC Emp ID': 'EMP102',
                'RMG Head': 'Robert Brown', 'RGS ID': 'RGS-002', 'Demand Count': 5,
                'Shared By': 'RMG', 'Pending/Confirmed': 'Pending', 'Supply Completed': 3,
                'Batch': 'Batch-2026-A'
            },
            {
                'BG': 'Tech SS', 'ISU/HSU': 'Cloud Ops', 'Project Name': 'Cloud Migration',
                'Stream': 'Cloud', 'Location': 'Pune', 'Role': 'Tech Support',
                'Project SPOC Name': 'Charlie Lee', 'Project SPOC Emp ID': 'EMP103',
                'RMG Head': 'Mary White', 'RGS ID': 'RGS-003', 'Demand Count': 4,
                'Shared By': 'Direct BU', 'Pending/Confirmed': 'Confirmed', 'Supply Completed': 4,
                'Batch': 'Batch-2026-A'
            },
            {
                'BG': 'Japan Ops', 'ISU/HSU': 'Testing COE', 'Project Name': 'Automated Regression',
                'Stream': 'Test Automation', 'Location': 'Chennai', 'Role': 'QA',
                'Project SPOC Name': 'David Green', 'Project SPOC Emp ID': 'EMP104',
                'RMG Head': 'Mary White', 'RGS ID': 'RGS-004', 'Demand Count': 6,
                'Shared By': 'RMG', 'Pending/Confirmed': 'Confirmed', 'Supply Completed': 6,
                'Batch': 'Batch-2026-A'
            }
        ]

    def test_section1_bg_demand_supply(self):
        generator = TalentAlignmentExcelReportGenerator(self.sample_records)
        df_sec1 = generator.compute_section1_bg_demand_supply()
        
        self.assertFalse(df_sec1.empty)
        self.assertIn('BG', df_sec1.columns)
        self.assertIn('Demand Count', df_sec1.columns)
        self.assertIn('Supply Completed', df_sec1.columns)
        
        # Check totals
        total_demand = df_sec1['Demand Count'].sum()
        total_supply = df_sec1['Supply Completed'].sum()
        self.assertEqual(total_demand, 25)
        self.assertEqual(total_supply, 21)

    def test_section2_role_demand_supply(self):
        generator = TalentAlignmentExcelReportGenerator(self.sample_records)
        df_sec2 = generator.compute_section2_role_demand_supply()
        
        self.assertIn('Role', df_sec2.columns)
        dev_row = df_sec2[df_sec2['Role'] == 'Developer']
        self.assertEqual(dev_row['Demand Count'].values[0], 15)
        self.assertEqual(dev_row['Supply Completed'].values[0], 11)

    def test_section3_stream_fulfilment(self):
        generator = TalentAlignmentExcelReportGenerator(self.sample_records)
        df_sec3 = generator.compute_section3_stream_fulfilment()
        
        self.assertIn('Stream', df_sec3.columns)
        self.assertIn('Same Stream Mapping %', df_sec3.columns)
        
        # SpringBoot demand should be 10, same mapped 8
        sb_row = df_sec3[df_sec3['Stream'] == 'SpringBoot']
        self.assertEqual(sb_row['Demand Count'].values[0], 10)
        self.assertEqual(sb_row['Mapped To Same Stream'].values[0], 8)
        self.assertEqual(sb_row['Same Stream Mapping %'].values[0], 0.8)

    def test_section4_cross_stream_matrix(self):
        generator = TalentAlignmentExcelReportGenerator(self.sample_records)
        df_matrix = generator.compute_section4_cross_stream_matrix()
        
        self.assertIn('Total Mapped', df_matrix.columns)
        self.assertIn('SpringBoot', df_matrix.index)
        self.assertEqual(df_matrix.loc['SpringBoot', 'SpringBoot'], 8)

    def test_section5_demand_met(self):
        generator = TalentAlignmentExcelReportGenerator(self.sample_records)
        sec5 = generator.compute_section5_demand_met()
        
        self.assertEqual(sec5['total_demand'], 25)
        self.assertEqual(sec5['total_supply'], 21)
        self.assertEqual(sec5['unfulfilled'], 4)
        self.assertAlmostEqual(sec5['decimal_ratio'], 0.84, places=2)
        self.assertAlmostEqual(sec5['percentage_val'], 84.0, places=1)

    def test_section6_rmg_summary(self):
        generator = TalentAlignmentExcelReportGenerator(self.sample_records)
        sec6 = generator.compute_section6_rmg_summary()
        
        # RMG: RGS-002 (5 demand, 3 supply) + RGS-004 (6 demand, 6 supply) = 11 demand, 9 supply
        self.assertEqual(sec6['rmg_demand'], 11)
        self.assertEqual(sec6['rmg_supply'], 9)
        
        # Direct BU: RGS-001 (10 demand, 8 supply) + RGS-003 (4 demand, 4 supply) = 14 demand, 12 supply
        self.assertEqual(sec6['direct_bu_demand'], 14)
        self.assertEqual(sec6['direct_bu_supply'], 12)

    def test_workbook_structure_and_two_sheets(self):
        generator = TalentAlignmentExcelReportGenerator(self.sample_records)
        wb = generator.generate_workbook()
        
        sheet_names = wb.sheetnames
        self.assertEqual(len(sheet_names), 2)
        self.assertEqual(sheet_names[0], "EXECUTIVE DASHBOARD")
        self.assertEqual(sheet_names[1], "RMG REQUIREMENT")

        # Check Sheet 2 columns
        ws2 = wb["RMG REQUIREMENT"]
        headers = [ws2.cell(row=1, column=col).value for col in range(1, 16)]
        self.assertEqual(headers, [
            "BG", "ISU/HSU", "Project Name", "Stream", "Location", "Role",
            "Project SPOC Name", "Project SPOC Emp ID", "RMG Head", "RGS ID",
            "Demand Count", "Shared By", "Pending/Confirmed", "Supply Completed", "Batch"
        ])
        # Verify 4 data rows + 1 header row = 5 rows
        self.assertEqual(ws2.max_row, 5)

        # Export to BytesIO and verify openpyxl can reload it
        buf = generator.export_to_bytes()
        self.assertGreater(buf.getbuffer().nbytes, 1000)
        reloaded_wb = openpyxl.load_workbook(buf)
        self.assertEqual(reloaded_wb.sheetnames, ["EXECUTIVE DASHBOARD", "RMG REQUIREMENT"])


class APITalentAlignmentTests(APITestCase):
    """Integration tests for Job creation with shared_by and Excel export endpoints."""

    def setUp(self):
        self.admin = User.objects.create_user(
            username='admin_test',
            email='admin@example.com',
            password='Password@123',
            role='admin'
        )
        self.client.force_authenticate(user=self.admin)

        # Create sample job in database
        self.job = Job.objects.create(
            project_name='Payment Gateway Modernization',
            location='Hyderabad',
            demand_id='DMD-991',
            skills='Java, Spring Boot, Microservices',
            stream='SpringBoot',
            openings=5,
            bg='BFSI',
            isu_hsu='Banking',
            role='Developer',
            shared_by='Direct BU',
            rmg_head='Jane RMG',
            spoc_name='John SPOC',
            spoc_emp_id='EMP991',
            rgs_id='RGS-991',
            filled=4,
            status='active',
            batch_name='Batch-2026-Test'
        )

    def test_create_job_with_shared_by_and_standard_stream(self):
        url = reverse('job-list')
        data = {
            'project_name': 'Cloud Infrastructure Security',
            'location': 'Bangalore',
            'demand_id': 'DMD-1002',
            'skills': 'AWS, Terraform, IAM',
            'stream': 'Cloud',
            'openings': 3,
            'bg': 'Tech SS',
            'isu_hsu': 'Security',
            'role': 'Developer',
            'shared_by': 'RMG',
            'spoc_name': 'Alice Manager',
            'spoc_emp_id': 'EMP1002',
            'rmg_head': 'Bob Head',
            'rgs_id': 'RGS-1002',
            'batch_name': 'Batch-2026-Test'
        }
        res = self.client.post(url, data, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        created_job = Job.objects.get(rgs_id='RGS-1002')
        self.assertEqual(created_job.shared_by, 'RMG')
        self.assertEqual(created_job.stream, 'Cloud')

    def test_export_talent_alignment_excel_endpoint(self):
        url = reverse('talent-alignment-excel-export')
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(
            res['Content-Type'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        self.assertIn('talent_alignment_executive_dashboard', res['Content-Disposition'])

        # Load workbook from response content
        wb = openpyxl.load_workbook(io.BytesIO(res.content))
        self.assertEqual(wb.sheetnames, ["EXECUTIVE DASHBOARD", "RMG REQUIREMENT"])

    def test_parse_jd_extracts_standard_stream_and_shared_by(self):
        url = reverse('parse-jd')
        raw_text = """
        Requirement from RMG: We need 4 Senior Spring Boot Developers for Core Banking Project in Hyderabad.
        Required Skills: Java, Spring Boot, Microservices, REST.
        Role: Developer, BG: BFSI, ISU: Banking, SPOC: Sarah (EMP401).
        """
        res = self.client.post(url, {'text': raw_text}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('stream', res.data)
        self.assertEqual(res.data['stream'], 'SpringBoot')
        self.assertEqual(res.data['shared_by'], 'RMG')


class DecoAndBulkUploadProfileTests(APITestCase):
    """Tests for DECO & Bulk Profile Ingestion, Null Safety, Group Persistence, and Reports."""

    def setUp(self):
        self.admin = User.objects.create_user(
            username='admin_profile_test',
            email='admin_profile@example.com',
            password='Password@123',
            role='admin'
        )
        self.client.force_authenticate(user=self.admin)

        # Exact 3 sample records from user's DECO payload (some with employeeId=null, some with employeeId="12345")
        self.sample_payload = {
            "data": [
                {
                    "id": 101,
                    "upskillCourses": None,
                    "certificates": None,
                    "userInfo": {
                        "name": "Trainee One",
                        "location": None,
                        "userId": "11111111-3b33-4a9e-95c5-aeb07a7b4cc9",
                        "averageScore": 100.0,
                        "employeeId": None,
                        "isu": None
                    },
                    "strengths": [
                        {
                            "courseName": "Java",
                            "avgScore": 100.0
                        }
                    ],
                    "weaknesses": [],
                    "batchRank": "1/24",
                    "groupRank": "1/8",
                    "groupName": "A1",
                    "dpi": 0.59,
                    "batchName": "Batch 0"
                },
                {
                    "id": 102,
                    "upskillCourses": None,
                    "certificates": None,
                    "userInfo": {
                        "name": "Trainee Two",
                        "location": "Hyderabad",
                        "userId": "22222222-e15c-405d-9cba-0d8e6fecc248",
                        "averageScore": 80.0,
                        "employeeId": "2962102",
                        "isu": "Banking"
                    },
                    "strengths": [
                        {
                            "courseName": "Java",
                            "avgScore": 80.0
                        }
                    ],
                    "weaknesses": [],
                    "batchRank": "6/24",
                    "groupRank": "2/8",
                    "groupName": "A1",
                    "dpi": 0.44,
                    "batchName": "Batch 0"
                },
                {
                    "id": 103,
                    "upskillCourses": None,
                    "certificates": None,
                    "userInfo": {
                        "name": "Trainee Three",
                        "location": "Pune",
                        "userId": "33333333-f5c7-4348-ba78-b11d13db7987",
                        "averageScore": 90.0,
                        "employeeId": None,
                        "isu": None
                    },
                    "strengths": [
                        {
                            "courseName": "Python",
                            "avgScore": 90.0
                        }
                    ],
                    "weaknesses": [],
                    "batchRank": "3/24",
                    "groupRank": "1/8",
                    "groupName": "D1",
                    "dpi": 0.75,
                    "batchName": "Batch 0"
                }
            ]
        }

    def test_bulk_upload_data_object_format_with_nulls(self):
        url = reverse('profiles-bulk-upload')
        res = self.client.post(url, self.sample_payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['created'], 3)
        self.assertEqual(res.data['failed'], 0)

        # Verify database records
        self.assertEqual(ProfileRecord.objects.count(), 3)
        p1 = ProfileRecord.objects.get(external_id=101)
        self.assertEqual(p1.group_name, 'A1')
        self.assertEqual(p1.groupRank, '1/8')
        self.assertEqual(p1.batchRank, '1/24')
        self.assertEqual(p1.batch_name, 'Batch 0')
        self.assertEqual(p1.userInfo.name, 'Trainee One')
        self.assertIsNone(p1.userInfo.employeeId)

        p2 = ProfileRecord.objects.get(external_id=102)
        self.assertEqual(p2.group_name, 'A1')
        self.assertEqual(p2.userInfo.employeeId, '2962102')
        # User auth record created for 2962102
        self.assertTrue(User.objects.filter(username='2962102').exists())

        p3 = ProfileRecord.objects.get(external_id=103)
        self.assertEqual(p3.group_name, 'D1')

    def test_bulk_upload_list_format_and_upsert(self):
        url = reverse('profiles-bulk-upload')
        # Upload as a plain list
        res = self.client.post(url, self.sample_payload['data'], format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['created'], 3)

        # Re-upload the exact same payload (upsert check - should not crash or duplicate)
        updated_payload = list(self.sample_payload['data'])
        updated_payload[0]['userInfo']['averageScore'] = 99.0
        res2 = self.client.post(url, updated_payload, format='json')
        self.assertEqual(res2.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ProfileRecord.objects.count(), 3)
        p1 = ProfileRecord.objects.get(external_id=101)
        self.assertEqual(p1.userInfo.averageScore, 99.0)

    def test_profile_list_group_filtering(self):
        # Ingest profiles
        self.client.post(reverse('profiles-bulk-upload'), self.sample_payload, format='json')

        # Test filtering by group=A1
        url_a1 = f"{reverse('profiles-list-create')}?group=A1"
        res_a1 = self.client.get(url_a1)
        self.assertEqual(res_a1.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_a1.data), 2)
        for item in res_a1.data:
            self.assertEqual(item['group_name'], 'A1')
            self.assertEqual(item['groupName'], 'A1')

        # Test filtering by group_name=D1
        url_d1 = f"{reverse('profiles-list-create')}?group_name=D1"
        res_d1 = self.client.get(url_d1)
        self.assertEqual(res_d1.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_d1.data), 1)
        self.assertEqual(res_d1.data[0]['group_name'], 'D1')

    def test_reports_include_group_column(self):
        # Ingest profiles
        self.client.post(reverse('profiles-bulk-upload'), self.sample_payload, format='json')

        # Unmapped trainees report CSV
        res_unmapped = self.client.get(reverse('report-unmapped'))
        self.assertEqual(res_unmapped.status_code, status.HTTP_200_OK)
        csv_content = res_unmapped.content.decode('utf-8')
        self.assertIn('Group Name', csv_content)
        self.assertIn('A1', csv_content)
        self.assertIn('D1', csv_content)

        # HR summary report Excel
        res_hr = self.client.get(reverse('hr-summary-report'))
        self.assertEqual(res_hr.status_code, status.HTTP_200_OK)
        wb = openpyxl.load_workbook(io.BytesIO(res_hr.content))
        self.assertIn('Trainee Status', wb.sheetnames)
        ws_trainee = wb['Trainee Status']
        headers = [ws_trainee.cell(row=1, column=c).value for c in range(1, 8)]
        self.assertIn('Group', headers)

    def test_profile_serialization_field_aliases(self):
        # Upload profile with groupName and batchName
        payload = [{
            "id": 999,
            "groupName": "C3",
            "batchName": "Batch 2026",
            "batchRank": "5/50",
            "groupRank": "1/10",
            "dpi": 0.88,
            "userInfo": {
                "name": "Alex Test",
                "userId": "99999999-aaaa-bbbb-cccc-dddddddddddd",
                "averageScore": 95.0
            },
            "strengths": [{"courseName": "Python", "avgScore": 95.0}],
            "weaknesses": []
        }]
        res = self.client.post(reverse('profiles-bulk-upload'), payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

        res_detail = self.client.get(reverse('profiles-detail', kwargs={'userId': '99999999-aaaa-bbbb-cccc-dddddddddddd'}))
        self.assertEqual(res_detail.status_code, status.HTTP_200_OK)
        data = res_detail.data
        self.assertEqual(data['group_name'], 'C3')
        self.assertEqual(data['groupName'], 'C3')
        self.assertEqual(data['batch_name'], 'Batch 2026')
        self.assertEqual(data['batchName'], 'Batch 2026')
        self.assertEqual(data['batchRank'], '5/50')
        self.assertEqual(data['groupRank'], '1/10')
        self.assertEqual(data['dpi'], 0.88)


class ServerLoggingAndMiddlewareTests(TestCase):
    """Unit tests for production request logging middleware and log file handlers."""

    def setUp(self):
        self.factory = RequestFactory()
        self.middleware = RequestLoggingMiddleware(get_response=lambda req: HttpResponse("OK", status=200))

    def test_client_ip_extraction(self):
        # Test X-Forwarded-For with multiple IPs
        req_xff = self.factory.get('/api/test/')
        req_xff.META['HTTP_X_FORWARDED_FOR'] = '203.0.113.195, 70.41.3.18, 150.172.238.178'
        self.assertEqual(get_client_ip(req_xff), '203.0.113.195')

        # Test X-Real-IP
        req_xrip = self.factory.get('/api/test/')
        req_xrip.META['HTTP_X_REAL_IP'] = '198.51.100.4'
        self.assertEqual(get_client_ip(req_xrip), '198.51.100.4')

        # Test default REMOTE_ADDR
        req_remote = self.factory.get('/api/test/')
        req_remote.META['REMOTE_ADDR'] = '192.0.2.1'
        self.assertEqual(get_client_ip(req_remote), '192.0.2.1')

    def test_middleware_request_id_and_header(self):
        req = self.factory.get('/api/test-route/')
        response = self.middleware(req)
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.has_header('X-Request-ID'))
        self.assertGreater(len(response['X-Request-ID']), 0)

    def test_middleware_status_level_logging(self):
        import logging

        # 200 OK -> INFO log
        with self.assertLogs('talentalign.requests', level='INFO') as cm:
            req_200 = self.factory.get('/api/jobs/')
            self.middleware(req_200)
            self.assertTrue(any("status=200" in msg for msg in cm.output))
            self.assertTrue(any("method=GET" in msg for msg in cm.output))

        # 404 Not Found -> WARNING log
        with self.assertLogs('talentalign.requests', level='WARNING') as cm:
            mw_404 = RequestLoggingMiddleware(get_response=lambda r: HttpResponse("Not Found", status=404))
            req_404 = self.factory.get('/api/nonexistent/')
            mw_404(req_404)
            self.assertTrue(any("status=404" in msg for msg in cm.output))

        # 500 Error -> ERROR log
        with self.assertLogs('talentalign.requests', level='ERROR') as cm:
            mw_500 = RequestLoggingMiddleware(get_response=lambda r: HttpResponse("Error", status=500))
            req_500 = self.factory.post('/api/faulty/')
            mw_500(req_500)
            self.assertTrue(any("status=500" in msg for msg in cm.output))

    def test_middleware_process_exception_logging(self):
        req = self.factory.get('/api/error-route/')
        self.middleware.process_request(req)
        test_exc = ValueError("Simulated database failure")

        with self.assertLogs('apis', level='ERROR') as cm:
            self.middleware.process_exception(req, test_exc)
            self.assertTrue(any("Simulated database failure" in msg for msg in cm.output))

    def test_log_files_directory_and_handlers(self):
        from django.conf import settings
        import os

        # Verify logs directory exists
        self.assertTrue(os.path.exists(settings.LOGS_DIR))

        # Test logger writes
        app_logger = logging.getLogger('apis')
        app_logger.info("Test server log entry")
        app_logger.error("Test error log entry")

        server_log_file = settings.LOGS_DIR / 'talentalign_server.log'
        error_log_file = settings.LOGS_DIR / 'talentalign_error.log'

        self.assertTrue(os.path.exists(server_log_file))
        self.assertTrue(os.path.exists(error_log_file))