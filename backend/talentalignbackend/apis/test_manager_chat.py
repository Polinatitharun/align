from django.test import TestCase

from .models import Job, ProfileRecord, UserInfo, Strength, Match
from .views import build_manager_chat_context, generate_manager_chat_answer


class ManagerChatTests(TestCase):
    def test_context_includes_job_and_trainee_details(self):
        job = Job.objects.create(
            project_name='Python Developer',
            location='Bangalore',
            demand_id='D-100',
            skills='Python, Django',
            openings=3,
            batch_name='BATCH-01',
            status='active',
        )

        user_info = UserInfo.objects.create(
            name='Alice Kumar',
            location='Bangalore',
            userId='u-001',
            averageScore=88.0,
            email='alice@example.com',
            isMapped=False,
        )
        profile = ProfileRecord.objects.create(userInfo=user_info, batch_name='BATCH-01')
        Strength.objects.create(profile=profile, courseName='Python', avgScore=90)
        Strength.objects.create(profile=profile, courseName='Django', avgScore=85)
        Match.objects.create(
            job_ref=job,
            trainee_ref=profile,
            trainee_name='Alice Kumar',
            trainee_location='Bangalore',
            trainee_id='u-001',
            job_id=job.id,
            job_title=job.project_name,
            skills_percentage=95.0,
            location_percentage=80.0,
            total_percentage=92.0,
            bucket='PERFECT_MATCH',
            matched_skills=['Python', 'Django'],
            rank=1,
        )

        context = build_manager_chat_context('BATCH-01')

        self.assertIn('Python Developer', context)
        self.assertIn('Top trainees', context)
        self.assertIn('Top skill gaps', context)

    def test_chat_answer_can_return_top_candidates_for_a_job(self):
        job = Job.objects.create(
            project_name='Java Developer',
            location='Hyderabad',
            demand_id='D-200',
            skills='Java, Spring',
            openings=2,
            batch_name='BATCH-02',
            status='active',
        )

        user_info = UserInfo.objects.create(
            name='Bob Rao',
            location='Hyderabad',
            userId='u-002',
            averageScore=82.0,
            email='bob@example.com',
            isMapped=False,
        )
        profile = ProfileRecord.objects.create(userInfo=user_info, batch_name='BATCH-02')
        Strength.objects.create(profile=profile, courseName='Java', avgScore=88)
        Match.objects.create(
            job_ref=job,
            trainee_ref=profile,
            trainee_name='Bob Rao',
            trainee_location='Hyderabad',
            trainee_id='u-002',
            job_id=job.id,
            job_title=job.project_name,
            skills_percentage=90.0,
            location_percentage=85.0,
            total_percentage=88.0,
            bucket='SKILLS_ONLY',
            matched_skills=['Java'],
            rank=1,
        )

        context = build_manager_chat_context('BATCH-02')
        answer = generate_manager_chat_answer(context, 'show 3 trainees for Java Developer')

        self.assertIn('Java Developer', answer)
        self.assertIn('Bob Rao', answer)
