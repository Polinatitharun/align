"""
excel_generator.py
Production-Ready Data Engineering & Excel Automation Engine for Talent Alignment.

Generates a 2-sheet executive business report:
- Sheet 1: EXECUTIVE DASHBOARD (6 Analytical Sections + Visual Styling)
- Sheet 2: RMG REQUIREMENT (15 Preserved Transactional Columns)
"""

import io
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional, Union, Tuple

import pandas as pd
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from openpyxl.formatting.rule import ColorScaleRule

from .stream_constants import (
    ALLOWED_STREAMS,
    normalize_to_standard_stream,
    is_valid_stream
)

logger = logging.getLogger(__name__)


class TalentAlignmentExcelReportGenerator:
    """
    Enterprise Data Engineering & Excel Automation Architect Service.
    Transforms raw demand and supply allocation records into a production-grade 
    executive workbook matching business specifications.
    """

    # --- Styling Palette Tokens ---
    PRIMARY_HEADER_FILL = PatternFill(start_color="1E293B", end_color="1E293B", fill_type="solid")     # Deep Slate Navy
    ACCENT_HEADER_FILL  = PatternFill(start_color="2563EB", end_color="2563EB", fill_type="solid")     # Royal Blue
    SECTION_HEADER_FILL = PatternFill(start_color="334155", end_color="334155", fill_type="solid")     # Slate 700
    SUBHEADER_FILL      = PatternFill(start_color="E2E8F0", end_color="E2E8F0", fill_type="solid")     # Light Slate 200
    ZEBRA_FILL          = PatternFill(start_color="F8FAFC", end_color="F8FAFC", fill_type="solid")     # Ultra Light Slate
    TOTAL_FILL          = PatternFill(start_color="F1F5F9", end_color="F1F5F9", fill_type="solid")     # Soft Gray Total
    DIAGONAL_MATCH_FILL = PatternFill(start_color="ECFDF5", end_color="ECFDF5", fill_type="solid")     # Soft Mint Green
    CARD_BG_FILL        = PatternFill(start_color="F0FDF4", end_color="F0FDF4", fill_type="solid")     # Light Emerald
    CARD_BG_BLUE        = PatternFill(start_color="EFF6FF", end_color="EFF6FF", fill_type="solid")     # Light Blue
    CARD_BG_PURPLE      = PatternFill(start_color="FAF5FF", end_color="FAF5FF", fill_type="solid")     # Light Purple

    FONT_TITLE          = Font(name="Segoe UI", size=16, bold=True, color="FFFFFF")
    FONT_SUBTITLE       = Font(name="Segoe UI", size=10, italic=True, color="E2E8F0")
    FONT_SECTION_TITLE  = Font(name="Segoe UI", size=12, bold=True, color="FFFFFF")
    FONT_HEADER         = Font(name="Segoe UI", size=10, bold=True, color="FFFFFF")
    FONT_SUBHEADER      = Font(name="Segoe UI", size=10, bold=True, color="1E293B")
    FONT_BODY           = Font(name="Segoe UI", size=10, color="0F172A")
    FONT_BODY_BOLD      = Font(name="Segoe UI", size=10, bold=True, color="0F172A")
    FONT_TOTAL          = Font(name="Segoe UI", size=10, bold=True, color="0F172A")
    FONT_CARD_NUM       = Font(name="Segoe UI", size=20, bold=True, color="1E3A8A")
    FONT_CARD_LBL       = Font(name="Segoe UI", size=9, bold=True, color="475569")

    # Border definitions
    THIN_BORDER_SIDE    = Side(border_style="thin", color="CBD5E1")
    THICK_BOTTOM_SIDE   = Side(border_style="medium", color="0F172A")
    DOUBLE_BOTTOM_SIDE  = Side(border_style="double", color="0F172A")
    
    REGULAR_BORDER = Border(
        left=THIN_BORDER_SIDE, right=THIN_BORDER_SIDE,
        top=THIN_BORDER_SIDE, bottom=THIN_BORDER_SIDE
    )
    TOTAL_BORDER = Border(
        left=THIN_BORDER_SIDE, right=THIN_BORDER_SIDE,
        top=THIN_BORDER_SIDE, bottom=DOUBLE_BOTTOM_SIDE
    )
    CARD_BORDER = Border(
        left=Side(border_style="medium", color="3B82F6"),
        right=THIN_BORDER_SIDE, top=THIN_BORDER_SIDE, bottom=THIN_BORDER_SIDE
    )

    ALIGN_LEFT   = Alignment(horizontal="left", vertical="center")
    ALIGN_RIGHT  = Alignment(horizontal="right", vertical="center")
    ALIGN_CENTER = Alignment(horizontal="center", vertical="center")

    def __init__(self, raw_data: Optional[Union[pd.DataFrame, List[Dict[str, Any]]]] = None, batch_name: Optional[str] = None):
        self.batch_name = batch_name
        self.df_raw: pd.DataFrame = pd.DataFrame()
        self.cross_mappings: List[Dict[str, Any]] = []
        
        if raw_data is not None:
            self.load_data(raw_data)

    # =========================================================================
    # 1. INGESTION & DATA SANITIZATION LAYER
    # =========================================================================

    def load_data(self, data: Union[pd.DataFrame, List[Dict[str, Any]]]) -> "TalentAlignmentExcelReportGenerator":
        """Ingest raw data from DataFrame or List of Dicts."""
        if isinstance(data, list):
            self.df_raw = pd.DataFrame(data)
        elif isinstance(data, pd.DataFrame):
            self.df_raw = data.copy()
        else:
            raise ValueError(f"Unsupported data type for report generator: {type(data)}")

        self._sanitize_and_prepare_data()
        return self

    @classmethod
    def from_file(cls, file_obj_or_path: Any, batch_name: Optional[str] = None) -> "TalentAlignmentExcelReportGenerator":
        """Ingest raw dataset from CSV or Excel file."""
        try:
            if hasattr(file_obj_or_path, 'name') and file_obj_or_path.name.lower().endswith('.csv'):
                df = pd.read_csv(file_obj_or_path)
            elif isinstance(file_obj_or_path, str) and file_obj_or_path.lower().endswith('.csv'):
                df = pd.read_csv(file_obj_or_path)
            else:
                df = pd.read_excel(file_obj_or_path)
        except Exception as e:
            logger.error(f"Failed to read file for Excel Report Generator: {e}")
            raise ValueError(f"Unable to parse input file: {e}")

        generator = cls(df, batch_name=batch_name)
        return generator

    @classmethod
    def from_database(cls, batch_name: Optional[str] = None) -> "TalentAlignmentExcelReportGenerator":
        """
        Pull live demand and supply allocation records directly from Django database.
        Traverses Job, UserInfo, ProfileRecord, Match, and InterviewLock models.
        """
        from .models import Job, UserInfo, ProfileRecord, InterviewLock, Match

        jobs_qs = Job.objects.all().select_related('course')
        if batch_name:
            jobs_qs = jobs_qs.filter(batch_name=batch_name)

        records = []
        cross_mappings = []

        # Find all mapped trainees across the database
        mapped_locks = InterviewLock.objects.filter(
            status__in=['mapped', 'selected', 'joined', 'offered']
        ).select_related('trainee__userInfo', 'job')

        if batch_name:
            mapped_locks = mapped_locks.filter(job__batch_name=batch_name)

        # Build mapping cache: job_id -> list of mapped trainees with their streams
        job_mappings: Dict[int, List[Dict[str, Any]]] = {}
        for lock in mapped_locks:
            j_id = lock.job_id
            t_profile = lock.trainee
            u_info = t_profile.userInfo if t_profile else None
            
            # Determine mapped resource stream
            res_stream = 'Others'
            if u_info and u_info.course:
                res_stream = normalize_to_standard_stream(u_info.course.name)
            elif t_profile:
                st = t_profile.strengths.first()
                if st and st.courseName:
                    res_stream = normalize_to_standard_stream(st.courseName)

            mapping_info = {
                'trainee_name': u_info.name if u_info else f"Trainee #{t_profile.id if t_profile else 'N/A'}",
                'trainee_emp_id': u_info.employeeId if u_info else '',
                'resource_stream': res_stream,
                'demand_stream': normalize_to_standard_stream(lock.job.stream) if lock.job else 'Others',
            }
            job_mappings.setdefault(j_id, []).append(mapping_info)
            cross_mappings.append(mapping_info)

        # Build transactional records from Jobs
        for job in jobs_qs:
            demand_stream = normalize_to_standard_stream(job.stream)
            mappings = job_mappings.get(job.id, [])
            mapped_count = len(mappings)
            supply_completed = max(job.filled or 0, mapped_count)

            shared_by_val = getattr(job, 'shared_by', None) or 'Direct BU'
            if str(shared_by_val).strip().upper() in ['RMG', 'RGS']:
                shared_by_clean = 'RMG'
            else:
                shared_by_clean = 'Direct BU'

            status_val = 'Confirmed' if (job.status == 'filled' or supply_completed >= (job.openings or 1)) else 'Pending'

            rec = {
                'BG': job.bg or 'Technology',
                'ISU/HSU': job.isu_hsu or 'ISU',
                'Project Name': job.project_name or 'Unnamed Project',
                'Stream': demand_stream,
                'Location': job.location or 'Offshore',
                'Role': job.role or 'Developer',
                'Project SPOC Name': job.spoc_name or '',
                'Project SPOC Emp ID': job.spoc_emp_id or '',
                'RMG Head': job.rmg_head or '',
                'RGS ID': job.rgs_id or job.demand_id or f"RGS-{job.id}",
                'Demand Count': int(job.openings or 1),
                'Shared By': shared_by_clean,
                'Pending/Confirmed': status_val,
                'Supply Completed': int(supply_completed),
                'Batch': job.batch_name or batch_name or 'Default',
                # Internal matching attributes
                '_job_id': job.id,
                '_mappings': mappings,
            }
            records.append(rec)

        generator = cls(records, batch_name=batch_name)
        generator.cross_mappings = cross_mappings
        return generator

    def _sanitize_and_prepare_data(self) -> None:
        """
        Normalizes column headers, handles missing/null values, maps standard streams,
        and enforces numeric data types.
        """
        if self.df_raw.empty:
            self.df_raw = pd.DataFrame(columns=[
                'BG', 'ISU/HSU', 'Project Name', 'Stream', 'Location', 'Role',
                'Project SPOC Name', 'Project SPOC Emp ID', 'RMG Head', 'RGS ID',
                'Demand Count', 'Shared By', 'Pending/Confirmed', 'Supply Completed', 'Batch'
            ])
            return

        # Case-insensitive column resolution
        col_mapping = {}
        for col in self.df_raw.columns:
            c_low = str(col).lower().strip().replace('_', ' ').replace('/', ' ')
            if 'bg' == c_low or 'business group' in c_low:
                col_mapping[col] = 'BG'
            elif 'isu' in c_low or 'hsu' in c_low:
                col_mapping[col] = 'ISU/HSU'
            elif 'project' in c_low and 'name' in c_low:
                col_mapping[col] = 'Project Name'
            elif 'stream' in c_low and 'resource' not in c_low and 'mapped' not in c_low:
                col_mapping[col] = 'Stream'
            elif 'location' in c_low:
                col_mapping[col] = 'Location'
            elif 'role' in c_low:
                col_mapping[col] = 'Role'
            elif 'spoc' in c_low and ('emp' in c_low or 'id' in c_low):
                col_mapping[col] = 'Project SPOC Emp ID'
            elif 'spoc' in c_low and 'name' in c_low:
                col_mapping[col] = 'Project SPOC Name'
            elif 'rmg' in c_low and 'head' in c_low:
                col_mapping[col] = 'RMG Head'
            elif 'rgs' in c_low or ('demand' in c_low and 'id' in c_low):
                col_mapping[col] = 'RGS ID'
            elif 'demand' in c_low and ('count' in c_low or 'open' in c_low or 'req' in c_low):
                col_mapping[col] = 'Demand Count'
            elif 'shared' in c_low or 'source' in c_low:
                col_mapping[col] = 'Shared By'
            elif 'status' in c_low or 'pending' in c_low or 'confirmed' in c_low:
                col_mapping[col] = 'Pending/Confirmed'
            elif 'supply' in c_low:
                col_mapping[col] = 'Supply Completed'
            elif 'batch' in c_low:
                col_mapping[col] = 'Batch'

        self.df_raw = self.df_raw.rename(columns=col_mapping)
        # Drop duplicate columns if multiple source fields mapped to the same standard column
        self.df_raw = self.df_raw.loc[:, ~self.df_raw.columns.duplicated(keep='first')]

        # Ensure all 15 standard columns exist
        standard_cols = [
            'BG', 'ISU/HSU', 'Project Name', 'Stream', 'Location', 'Role',
            'Project SPOC Name', 'Project SPOC Emp ID', 'RMG Head', 'RGS ID',
            'Demand Count', 'Shared By', 'Pending/Confirmed', 'Supply Completed', 'Batch'
        ]

        for col in standard_cols:
            if col not in self.df_raw.columns:
                if col == 'Demand Count':
                    self.df_raw[col] = 1
                elif col == 'Supply Completed':
                    self.df_raw[col] = 0
                elif col == 'Shared By':
                    self.df_raw[col] = 'Direct BU'
                elif col == 'Pending/Confirmed':
                    self.df_raw[col] = 'Pending'
                elif col == 'BG':
                    self.df_raw[col] = 'Technology'
                elif col == 'Role':
                    self.df_raw[col] = 'Developer'
                else:
                    self.df_raw[col] = ''

        # Clean null values and format types
        self.df_raw['BG'] = self.df_raw['BG'].fillna('Technology').astype(str).str.strip()
        self.df_raw['ISU/HSU'] = self.df_raw['ISU/HSU'].fillna('ISU').astype(str).str.strip()
        self.df_raw['Project Name'] = self.df_raw['Project Name'].fillna('Unnamed Project').astype(str).str.strip()
        self.df_raw['Role'] = self.df_raw['Role'].fillna('Developer').astype(str).str.strip()
        self.df_raw['Location'] = self.df_raw['Location'].fillna('Offshore').astype(str).str.strip()
        self.df_raw['Shared By'] = self.df_raw['Shared By'].fillna('Direct BU').apply(
            lambda x: 'RMG' if 'rmg' in str(x).lower() or 'rgs' in str(x).lower() else 'Direct BU'
        )
        self.df_raw['Pending/Confirmed'] = self.df_raw['Pending/Confirmed'].fillna('Pending').astype(str).str.strip()
        self.df_raw['Batch'] = self.df_raw['Batch'].fillna(self.batch_name or 'Default').astype(str).str.strip()

        # Normalize Stream strictly to 10 allowed streams
        self.df_raw['Stream'] = self.df_raw['Stream'].apply(normalize_to_standard_stream)

        # Parse numeric counts safely
        self.df_raw['Demand Count'] = pd.to_numeric(self.df_raw['Demand Count'], errors='coerce').fillna(1).astype(int)
        self.df_raw['Supply Completed'] = pd.to_numeric(self.df_raw['Supply Completed'], errors='coerce').fillna(0).astype(int)

        # Deduplicate records by RGS ID / Project Name to avoid inflating totals
        if 'RGS ID' in self.df_raw.columns:
            non_empty_rgs = self.df_raw[self.df_raw['RGS ID'].astype(str).str.strip() != '']
            if not non_empty_rgs.empty:
                self.df_raw = self.df_raw.drop_duplicates(subset=['RGS ID'], keep='first')

    # =========================================================================
    # 2. ANALYTICAL AGGREGATION & METRIC COMPUTATION ENGINE
    # =========================================================================

    def compute_section1_bg_demand_supply(self) -> pd.DataFrame:
        """
        SECTION 1: Demand vs Supply by BG.
        Dynamic to all existing and future BGs + Grand Total.
        """
        if self.df_raw.empty:
            return pd.DataFrame(columns=['BG', 'Demand Count', 'Supply Completed', 'Fulfilment %'])

        grouped = self.df_raw.groupby('BG', as_index=False).agg({
            'Demand Count': 'sum',
            'Supply Completed': 'sum'
        }).sort_values(by='Demand Count', ascending=False)

        grouped['Fulfilment %'] = grouped.apply(
            lambda r: (r['Supply Completed'] / r['Demand Count']) if r['Demand Count'] > 0 else 0.0,
            axis=1
        )
        return grouped

    def compute_section2_role_demand_supply(self) -> pd.DataFrame:
        """
        SECTION 2: Role Wise Demand vs Supply.
        Dynamic to all existing and future Roles + Grand Total.
        """
        if self.df_raw.empty:
            return pd.DataFrame(columns=['Role', 'Demand Count', 'Supply Completed', 'Fulfilment %'])

        grouped = self.df_raw.groupby('Role', as_index=False).agg({
            'Demand Count': 'sum',
            'Supply Completed': 'sum'
        }).sort_values(by='Demand Count', ascending=False)

        grouped['Fulfilment %'] = grouped.apply(
            lambda r: (r['Supply Completed'] / r['Demand Count']) if r['Demand Count'] > 0 else 0.0,
            axis=1
        )
        return grouped

    def compute_section3_stream_fulfilment(self) -> pd.DataFrame:
        """
        SECTION 3: Stream Fulfilment Analysis.
        Calculates Demand Count, Mapped to Same Stream, and Same Stream Mapping %.
        """
        if self.df_raw.empty:
            return pd.DataFrame(columns=['Stream', 'Demand Count', 'Mapped To Same Stream', 'Same Stream Mapping %'])

        # Aggregate total demand and supply per demand stream
        stream_grp = self.df_raw.groupby('Stream', as_index=False).agg({
            'Demand Count': 'sum',
            'Supply Completed': 'sum'
        })

        # Calculate same-stream mapped resources
        # If cross_mappings metadata exists, compute directly. Otherwise, infer same-stream allocation.
        same_stream_counts: Dict[str, int] = {}
        if self.cross_mappings:
            for item in self.cross_mappings:
                d_stream = item.get('demand_stream', 'Others')
                r_stream = item.get('resource_stream', 'Others')
                if d_stream == r_stream:
                    same_stream_counts[d_stream] = same_stream_counts.get(d_stream, 0) + 1
        else:
            # When cross mappings aren't explicitly passed, Same Stream supply is the direct Supply Completed
            for _, row in stream_grp.iterrows():
                same_stream_counts[row['Stream']] = row['Supply Completed']

        records = []
        # Ensure all 10 allowed streams appear in analytical order, plus any present in data
        ordered_streams = [s for s in ALLOWED_STREAMS if s in stream_grp['Stream'].values]
        other_streams = [s for s in stream_grp['Stream'].unique() if s not in ordered_streams]
        all_display_streams = ordered_streams + other_streams

        for stream in all_display_streams:
            row_data = stream_grp[stream_grp['Stream'] == stream]
            demand_count = int(row_data['Demand Count'].sum()) if not row_data.empty else 0
            same_mapped = min(same_stream_counts.get(stream, 0), demand_count)
            pct = (same_mapped / demand_count) if demand_count > 0 else 0.0
            records.append({
                'Stream': stream,
                'Demand Count': demand_count,
                'Mapped To Same Stream': same_mapped,
                'Same Stream Mapping %': pct
            })

        df_sec3 = pd.DataFrame(records)
        return df_sec3

    def compute_section4_cross_stream_matrix(self) -> pd.DataFrame:
        """
        SECTION 4: Cross Stream Mapping Matrix.
        Rows = Demand Stream, Columns = Mapped Stream.
        Cell = Count of resources mapped from Demand Stream -> Mapped Stream.
        """
        # Determine all active streams
        active_demand_streams = self.df_raw['Stream'].unique().tolist() if not self.df_raw.empty else ALLOWED_STREAMS
        row_streams = [s for s in ALLOWED_STREAMS if s in active_demand_streams] + [s for s in active_demand_streams if s not in ALLOWED_STREAMS]
        col_streams = list(ALLOWED_STREAMS)

        # Initialize matrix with zeros
        matrix = {d_stream: {m_stream: 0 for m_stream in col_streams} for d_stream in row_streams}

        if self.cross_mappings:
            for item in self.cross_mappings:
                d_stream = item.get('demand_stream', 'Others')
                r_stream = item.get('resource_stream', 'Others')
                if d_stream in matrix and r_stream in matrix[d_stream]:
                    matrix[d_stream][r_stream] += 1
                elif d_stream in matrix and 'Others' in matrix[d_stream]:
                    matrix[d_stream]['Others'] += 1
        else:
            # Synthetic same-stream baseline when raw mapping records are aggregated at job level
            for _, row in self.df_raw.iterrows():
                d_stream = row['Stream']
                supply = int(row['Supply Completed'])
                if d_stream in matrix and d_stream in matrix[d_stream]:
                    matrix[d_stream][d_stream] += supply

        df_matrix = pd.DataFrame.from_dict(matrix, orient='index')
        df_matrix.index.name = 'Demand Stream'
        df_matrix['Total Mapped'] = df_matrix.sum(axis=1)
        return df_matrix

    def compute_section5_demand_met(self) -> Dict[str, Any]:
        """
        SECTION 5: Overall Demand Met %.
        Formula: Total Supply Completed / Total Demand Count.
        """
        total_demand = int(self.df_raw['Demand Count'].sum()) if not self.df_raw.empty else 0
        total_supply = int(self.df_raw['Supply Completed'].sum()) if not self.df_raw.empty else 0
        ratio = (total_supply / total_demand) if total_demand > 0 else 0.0

        return {
            'total_demand': total_demand,
            'total_supply': total_supply,
            'unfulfilled': max(0, total_demand - total_supply),
            'decimal_ratio': ratio,
            'percentage_val': ratio * 100.0,
            'percentage_str': f"{ratio * 100.0:.1f}%"
        }

    def compute_section6_rmg_summary(self) -> Dict[str, Any]:
        """
        SECTION 6: RMG Summary.
        Calculates RMG Demand/Supply vs Others/Direct BU Demand/Supply.
        """
        if self.df_raw.empty:
            return {
                'rmg_demand': 0,
                'rmg_supply': 0,
                'rmg_fulfilment_pct': 0.0,
                'direct_bu_demand': 0,
                'direct_bu_supply': 0,
                'direct_bu_fulfilment_pct': 0.0,
                'total_demand': 0,
                'total_supply': 0,
                'total_fulfilment_pct': 0.0,
            }

        rmg_mask = self.df_raw['Shared By'].astype(str).str.upper() == 'RMG'
        rmg_df = self.df_raw[rmg_mask]
        bu_df = self.df_raw[~rmg_mask]

        rmg_demand = int(rmg_df['Demand Count'].sum())
        rmg_supply = int(rmg_df['Supply Completed'].sum())
        rmg_pct = (rmg_supply / rmg_demand) if rmg_demand > 0 else 0.0

        bu_demand = int(bu_df['Demand Count'].sum())
        bu_supply = int(bu_df['Supply Completed'].sum())
        bu_pct = (bu_supply / bu_demand) if bu_demand > 0 else 0.0

        total_demand = rmg_demand + bu_demand
        total_supply = rmg_supply + bu_supply
        total_pct = (total_supply / total_demand) if total_demand > 0 else 0.0

        return {
            'rmg_demand': rmg_demand,
            'rmg_supply': rmg_supply,
            'rmg_fulfilment_pct': rmg_pct,
            'direct_bu_demand': bu_demand,
            'direct_bu_supply': bu_supply,
            'direct_bu_fulfilment_pct': bu_pct,
            'total_demand': total_demand,
            'total_supply': total_supply,
            'total_fulfilment_pct': total_pct,
        }

    # =========================================================================
    # 3. EXCEL WORKBOOK GENERATION & STYLING ARCHITECTURE (OpenPyXL)
    # =========================================================================

    def generate_workbook(self) -> openpyxl.Workbook:
        """
        Builds and styles the complete 2-sheet business Excel workbook.
        Sheet 1: EXECUTIVE DASHBOARD
        Sheet 2: RMG REQUIREMENT
        """
        wb = openpyxl.Workbook()
        
        # Setup Sheet 1: EXECUTIVE DASHBOARD
        ws_dash = wb.active
        ws_dash.title = "EXECUTIVE DASHBOARD"
        ws_dash.views.sheetView[0].showGridLines = True

        # Setup Sheet 2: RMG REQUIREMENT
        ws_rmg = wb.create_sheet(title="RMG REQUIREMENT")
        ws_rmg.views.sheetView[0].showGridLines = True

        # Render Sheet 1 & Sheet 2
        self._render_executive_dashboard(ws_dash)
        self._render_rmg_requirement_sheet(ws_rmg)

        return wb

    def _render_executive_dashboard(self, ws: openpyxl.worksheet.worksheet.Worksheet) -> None:
        """Renders the executive analytical sections on Sheet 1."""

        # ----------------- TITLE BANNER -----------------
        ws.merge_cells("A1:N2")
        title_cell = ws["A1"]
        title_cell.value = "TALENT ALIGNMENT EXECUTIVE DASHBOARD"
        title_cell.font = self.FONT_TITLE
        title_cell.fill = self.PRIMARY_HEADER_FILL
        title_cell.alignment = self.ALIGN_CENTER

        ws.merge_cells("A3:N3")
        subtitle_cell = ws["A3"]
        batch_text = f" | Batch: {self.batch_name}" if self.batch_name else " | Enterprise-wide Scope"
        subtitle_cell.value = f"Workforce Demand, Supply & Cross-Stream Fulfilment Analytics{batch_text} | Generated: {datetime.now().strftime('%d-%b-%Y %H:%M')}"
        subtitle_cell.font = self.FONT_SUBTITLE
        subtitle_cell.fill = self.PRIMARY_HEADER_FILL
        subtitle_cell.alignment = self.ALIGN_CENTER

        # ----------------- TOP KPI CARDS (SECTION 5 & OVERVIEW) -----------------
        sec5 = self.compute_section5_demand_met()
        sec6 = self.compute_section6_rmg_summary()

        # KPI Card 1: Total Demand
        self._render_kpi_card(ws, start_col=1, start_row=5, end_col=2, end_row=6,
                              title="TOTAL DEMAND", value=f"{sec5['total_demand']:,}", fill=self.CARD_BG_BLUE)
        
        # KPI Card 2: Total Supply Completed
        self._render_kpi_card(ws, start_col=4, start_row=5, end_col=5, end_row=6,
                              title="SUPPLY COMPLETED", value=f"{sec5['total_supply']:,}", fill=self.CARD_BG_FILL)

        # KPI Card 3: Demand Met % (Section 5)
        self._render_kpi_card(ws, start_col=7, start_row=5, end_col=8, end_row=6,
                              title="DEMAND MET %", value=f"{sec5['percentage_val']:.1f}% ({sec5['decimal_ratio']:.2f})", fill=self.CARD_BG_FILL)

        # KPI Card 4: RMG Fulfilment
        self._render_kpi_card(ws, start_col=10, start_row=5, end_col=11, end_row=6,
                              title="RMG FULFILMENT", value=f"{sec6['rmg_fulfilment_pct']*100:.1f}%", fill=self.CARD_BG_PURPLE)

        # KPI Card 5: Direct BU Fulfilment
        self._render_kpi_card(ws, start_col=13, start_row=5, end_col=14, end_row=6,
                              title="DIRECT BU FULFILMENT", value=f"{sec6['direct_bu_fulfilment_pct']*100:.1f}%", fill=self.CARD_BG_PURPLE)

        # ----------------- SECTION 1 & SECTION 2: LEFT / RIGHT TABLES -----------------
        # Start at Row 8
        current_row = 8

        # Left Column: SECTION 1 (Demand vs Supply by BG)
        bg_df = self.compute_section1_bg_demand_supply()
        sec1_end_row = self._render_section1_bg_table(ws, bg_df, start_col=1, start_row=current_row)

        # Right Column: SECTION 2 (Role Wise Demand vs Supply)
        role_df = self.compute_section2_role_demand_supply()
        sec2_end_row = self._render_section2_role_table(ws, role_df, start_col=6, start_row=current_row)

        # Align current_row to max of sec1 and sec2
        current_row = max(sec1_end_row, sec2_end_row) + 2

        # ----------------- SECTION 3 & SECTION 6 -----------------
        # Left Column: SECTION 6 (RMG Summary)
        sec6_end_row = self._render_section6_rmg_table(ws, sec6, start_col=1, start_row=current_row)

        # Right Column: SECTION 3 (Stream Fulfilment Analysis)
        stream_df = self.compute_section3_stream_fulfilment()
        sec3_end_row = self._render_section3_stream_table(ws, stream_df, start_col=6, start_row=current_row)

        current_row = max(sec6_end_row, sec3_end_row) + 2

        # ----------------- SECTION 4: CROSS STREAM MAPPING MATRIX -----------------
        matrix_df = self.compute_section4_cross_stream_matrix()
        self._render_section4_matrix_table(ws, matrix_df, start_col=1, start_row=current_row)

        # Freeze Panes under Header/KPI Block (Row 7)
        ws.freeze_panes = "A8"

        # Auto-fit columns with safety margin
        self._auto_fit_columns(ws, max_cols=16)

    def _render_kpi_card(self, ws, start_col: int, start_row: int, end_col: int, end_row: int,
                         title: str, value: str, fill: PatternFill) -> None:
        """Renders an executive KPI summary card."""
        for r in range(start_row, end_row + 1):
            for c in range(start_col, end_col + 1):
                cell = ws.cell(row=r, column=c)
                cell.fill = fill
                cell.border = self.CARD_BORDER

        ws.merge_cells(start_row=start_row, start_column=start_col, end_row=start_row, end_column=end_col)
        t_cell = ws.cell(row=start_row, column=start_col)
        t_cell.value = title
        t_cell.font = self.FONT_CARD_LBL
        t_cell.alignment = self.ALIGN_CENTER

        ws.merge_cells(start_row=end_row, start_column=start_col, end_row=end_row, end_column=end_col)
        v_cell = ws.cell(row=end_row, column=start_col)
        v_cell.value = value
        v_cell.font = self.FONT_CARD_NUM
        v_cell.alignment = self.ALIGN_CENTER

    def _render_section1_bg_table(self, ws, df: pd.DataFrame, start_col: int, start_row: int) -> int:
        """Renders Section 1: Demand vs Supply by BG."""
        # Section Header Banner
        ws.merge_cells(start_row=start_row, start_column=start_col, end_row=start_row, end_column=start_col + 3)
        hdr = ws.cell(row=start_row, column=start_col)
        hdr.value = "SECTION 1: DEMAND VS SUPPLY BY BG"
        hdr.font = self.FONT_SECTION_TITLE
        hdr.fill = self.ACCENT_HEADER_FILL
        hdr.alignment = self.ALIGN_LEFT

        headers = ["BG", "Demand Count", "Supply Completed", "Fulfilment %"]
        r = start_row + 1
        for i, h in enumerate(headers):
            cell = ws.cell(row=r, column=start_col + i, value=h)
            cell.font = self.FONT_HEADER
            cell.fill = self.SECTION_HEADER_FILL
            cell.alignment = self.ALIGN_LEFT if i == 0 else self.ALIGN_RIGHT
            cell.border = self.REGULAR_BORDER

        data_start_row = r + 1
        r += 1
        for idx, row in df.iterrows():
            c0 = ws.cell(row=r, column=start_col, value=str(row['BG']))
            c1 = ws.cell(row=r, column=start_col + 1, value=int(row['Demand Count']))
            c2 = ws.cell(row=r, column=start_col + 2, value=int(row['Supply Completed']))
            c3 = ws.cell(row=r, column=start_col + 3)
            # Excel formula for Fulfilment %: Supply / Demand
            c3.value = f"={get_column_letter(start_col+2)}{r}/{get_column_letter(start_col+1)}{r}" if row['Demand Count'] > 0 else 0.0

            # Formatting
            c0.font = self.FONT_BODY
            c0.alignment = self.ALIGN_LEFT
            c1.font = self.FONT_BODY
            c1.number_format = '#,##0'
            c1.alignment = self.ALIGN_RIGHT
            c2.font = self.FONT_BODY
            c2.number_format = '#,##0'
            c2.alignment = self.ALIGN_RIGHT
            c3.font = self.FONT_BODY
            c3.number_format = '0.0%'
            c3.alignment = self.ALIGN_RIGHT

            # Zebra striping
            row_fill = self.ZEBRA_FILL if (idx % 2 == 1) else PatternFill(fill_type=None)
            for c in [c0, c1, c2, c3]:
                if row_fill.fill_type:
                    c.fill = row_fill
                c.border = self.REGULAR_BORDER
            r += 1

        # Grand Total Row
        data_end_row = r - 1
        gt0 = ws.cell(row=r, column=start_col, value="Grand Total")
        gt1 = ws.cell(row=r, column=start_col + 1)
        gt2 = ws.cell(row=r, column=start_col + 2)
        gt3 = ws.cell(row=r, column=start_col + 3)

        col1_let = get_column_letter(start_col + 1)
        col2_let = get_column_letter(start_col + 2)

        if data_end_row >= data_start_row:
            gt1.value = f"=SUM({col1_let}{data_start_row}:{col1_let}{data_end_row})"
            gt2.value = f"=SUM({col2_let}{data_start_row}:{col2_let}{data_end_row})"
            gt3.value = f"={col2_let}{r}/{col1_let}{r}"
        else:
            gt1.value = 0
            gt2.value = 0
            gt3.value = 0.0

        for c in [gt0, gt1, gt2, gt3]:
            c.font = self.FONT_TOTAL
            c.fill = self.TOTAL_FILL
            c.border = self.TOTAL_BORDER

        gt0.alignment = self.ALIGN_LEFT
        gt1.number_format = '#,##0'
        gt1.alignment = self.ALIGN_RIGHT
        gt2.number_format = '#,##0'
        gt2.alignment = self.ALIGN_RIGHT
        gt3.number_format = '0.0%'
        gt3.alignment = self.ALIGN_RIGHT

        return r

    def _render_section2_role_table(self, ws, df: pd.DataFrame, start_col: int, start_row: int) -> int:
        """Renders Section 2: Role Wise Demand vs Supply."""
        ws.merge_cells(start_row=start_row, start_column=start_col, end_row=start_row, end_column=start_col + 3)
        hdr = ws.cell(row=start_row, column=start_col)
        hdr.value = "SECTION 2: ROLE WISE DEMAND VS SUPPLY"
        hdr.font = self.FONT_SECTION_TITLE
        hdr.fill = self.ACCENT_HEADER_FILL
        hdr.alignment = self.ALIGN_LEFT

        headers = ["Role", "Demand Count", "Supply Completed", "Fulfilment %"]
        r = start_row + 1
        for i, h in enumerate(headers):
            cell = ws.cell(row=r, column=start_col + i, value=h)
            cell.font = self.FONT_HEADER
            cell.fill = self.SECTION_HEADER_FILL
            cell.alignment = self.ALIGN_LEFT if i == 0 else self.ALIGN_RIGHT
            cell.border = self.REGULAR_BORDER

        data_start_row = r + 1
        r += 1
        for idx, row in df.iterrows():
            c0 = ws.cell(row=r, column=start_col, value=str(row['Role']))
            c1 = ws.cell(row=r, column=start_col + 1, value=int(row['Demand Count']))
            c2 = ws.cell(row=r, column=start_col + 2, value=int(row['Supply Completed']))
            c3 = ws.cell(row=r, column=start_col + 3)
            c3.value = f"={get_column_letter(start_col+2)}{r}/{get_column_letter(start_col+1)}{r}" if row['Demand Count'] > 0 else 0.0

            c0.font = self.FONT_BODY
            c0.alignment = self.ALIGN_LEFT
            c1.font = self.FONT_BODY
            c1.number_format = '#,##0'
            c1.alignment = self.ALIGN_RIGHT
            c2.font = self.FONT_BODY
            c2.number_format = '#,##0'
            c2.alignment = self.ALIGN_RIGHT
            c3.font = self.FONT_BODY
            c3.number_format = '0.0%'
            c3.alignment = self.ALIGN_RIGHT

            row_fill = self.ZEBRA_FILL if (idx % 2 == 1) else PatternFill(fill_type=None)
            for c in [c0, c1, c2, c3]:
                if row_fill.fill_type:
                    c.fill = row_fill
                c.border = self.REGULAR_BORDER
            r += 1

        data_end_row = r - 1
        gt0 = ws.cell(row=r, column=start_col, value="Grand Total")
        gt1 = ws.cell(row=r, column=start_col + 1)
        gt2 = ws.cell(row=r, column=start_col + 2)
        gt3 = ws.cell(row=r, column=start_col + 3)

        col1_let = get_column_letter(start_col + 1)
        col2_let = get_column_letter(start_col + 2)

        if data_end_row >= data_start_row:
            gt1.value = f"=SUM({col1_let}{data_start_row}:{col1_let}{data_end_row})"
            gt2.value = f"=SUM({col2_let}{data_start_row}:{col2_let}{data_end_row})"
            gt3.value = f"={col2_let}{r}/{col1_let}{r}"
        else:
            gt1.value = 0
            gt2.value = 0
            gt3.value = 0.0

        for c in [gt0, gt1, gt2, gt3]:
            c.font = self.FONT_TOTAL
            c.fill = self.TOTAL_FILL
            c.border = self.TOTAL_BORDER

        gt0.alignment = self.ALIGN_LEFT
        gt1.number_format = '#,##0'
        gt1.alignment = self.ALIGN_RIGHT
        gt2.number_format = '#,##0'
        gt2.alignment = self.ALIGN_RIGHT
        gt3.number_format = '0.0%'
        gt3.alignment = self.ALIGN_RIGHT

        return r

    def _render_section3_stream_table(self, ws, df: pd.DataFrame, start_col: int, start_row: int) -> int:
        """Renders Section 3: Stream Fulfilment Analysis."""
        ws.merge_cells(start_row=start_row, start_column=start_col, end_row=start_row, end_column=start_col + 3)
        hdr = ws.cell(row=start_row, column=start_col)
        hdr.value = "SECTION 3: STREAM FULFILMENT ANALYSIS"
        hdr.font = self.FONT_SECTION_TITLE
        hdr.fill = self.ACCENT_HEADER_FILL
        hdr.alignment = self.ALIGN_LEFT

        headers = ["Demand Stream", "Demand Count", "Mapped To Same Stream", "Same Stream Mapping %"]
        r = start_row + 1
        for i, h in enumerate(headers):
            cell = ws.cell(row=r, column=start_col + i, value=h)
            cell.font = self.FONT_HEADER
            cell.fill = self.SECTION_HEADER_FILL
            cell.alignment = self.ALIGN_LEFT if i == 0 else self.ALIGN_RIGHT
            cell.border = self.REGULAR_BORDER

        data_start_row = r + 1
        r += 1
        for idx, row in df.iterrows():
            c0 = ws.cell(row=r, column=start_col, value=str(row['Stream']))
            c1 = ws.cell(row=r, column=start_col + 1, value=int(row['Demand Count']))
            c2 = ws.cell(row=r, column=start_col + 2, value=int(row['Mapped To Same Stream']))
            c3 = ws.cell(row=r, column=start_col + 3)
            # Formula: Same Stream / Demand Count
            c3.value = f"={get_column_letter(start_col+2)}{r}/{get_column_letter(start_col+1)}{r}" if row['Demand Count'] > 0 else 0.0

            c0.font = self.FONT_BODY
            c0.alignment = self.ALIGN_LEFT
            c1.font = self.FONT_BODY
            c1.number_format = '#,##0'
            c1.alignment = self.ALIGN_RIGHT
            c2.font = self.FONT_BODY
            c2.number_format = '#,##0'
            c2.alignment = self.ALIGN_RIGHT
            c3.font = self.FONT_BODY
            c3.number_format = '0.0%'
            c3.alignment = self.ALIGN_RIGHT

            row_fill = self.ZEBRA_FILL if (idx % 2 == 1) else PatternFill(fill_type=None)
            for c in [c0, c1, c2, c3]:
                if row_fill.fill_type:
                    c.fill = row_fill
                c.border = self.REGULAR_BORDER
            r += 1

        data_end_row = r - 1
        gt0 = ws.cell(row=r, column=start_col, value="Grand Total")
        gt1 = ws.cell(row=r, column=start_col + 1)
        gt2 = ws.cell(row=r, column=start_col + 2)
        gt3 = ws.cell(row=r, column=start_col + 3)

        col1_let = get_column_letter(start_col + 1)
        col2_let = get_column_letter(start_col + 2)

        if data_end_row >= data_start_row:
            gt1.value = f"=SUM({col1_let}{data_start_row}:{col1_let}{data_end_row})"
            gt2.value = f"=SUM({col2_let}{data_start_row}:{col2_let}{data_end_row})"
            gt3.value = f"={col2_let}{r}/{col1_let}{r}"
        else:
            gt1.value = 0
            gt2.value = 0
            gt3.value = 0.0

        for c in [gt0, gt1, gt2, gt3]:
            c.font = self.FONT_TOTAL
            c.fill = self.TOTAL_FILL
            c.border = self.TOTAL_BORDER

        gt0.alignment = self.ALIGN_LEFT
        gt1.number_format = '#,##0'
        gt1.alignment = self.ALIGN_RIGHT
        gt2.number_format = '#,##0'
        gt2.alignment = self.ALIGN_RIGHT
        gt3.number_format = '0.0%'
        gt3.alignment = self.ALIGN_RIGHT

        return r

    def _render_section6_rmg_table(self, ws, data: Dict[str, Any], start_col: int, start_row: int) -> int:
        """Renders Section 6: RMG Summary."""
        ws.merge_cells(start_row=start_row, start_column=start_col, end_row=start_row, end_column=start_col + 3)
        hdr = ws.cell(row=start_row, column=start_col)
        hdr.value = "SECTION 6: RMG SUMMARY"
        hdr.font = self.FONT_SECTION_TITLE
        hdr.fill = self.ACCENT_HEADER_FILL
        hdr.alignment = self.ALIGN_LEFT

        headers = ["Source Category", "Demand Count", "Supply Completed", "Fulfilment %"]
        r = start_row + 1
        for i, h in enumerate(headers):
            cell = ws.cell(row=r, column=start_col + i, value=h)
            cell.font = self.FONT_HEADER
            cell.fill = self.SECTION_HEADER_FILL
            cell.alignment = self.ALIGN_LEFT if i == 0 else self.ALIGN_RIGHT
            cell.border = self.REGULAR_BORDER

        # Row 1: RMG
        r += 1
        r_rmg = r
        c0 = ws.cell(row=r, column=start_col, value="RMG Demand / Supply")
        c1 = ws.cell(row=r, column=start_col + 1, value=data['rmg_demand'])
        c2 = ws.cell(row=r, column=start_col + 2, value=data['rmg_supply'])
        c3 = ws.cell(row=r, column=start_col + 3, value=f"={get_column_letter(start_col+2)}{r}/{get_column_letter(start_col+1)}{r}" if data['rmg_demand'] > 0 else 0.0)

        for c in [c0, c1, c2, c3]:
            c.font = self.FONT_BODY
            c.border = self.REGULAR_BORDER
        c0.alignment = self.ALIGN_LEFT
        c1.number_format = '#,##0'
        c1.alignment = self.ALIGN_RIGHT
        c2.number_format = '#,##0'
        c2.alignment = self.ALIGN_RIGHT
        c3.number_format = '0.0%'
        c3.alignment = self.ALIGN_RIGHT

        # Row 2: Direct BU / Others
        r += 1
        r_bu = r
        b0 = ws.cell(row=r, column=start_col, value="Others / Direct BU Requirements")
        b1 = ws.cell(row=r, column=start_col + 1, value=data['direct_bu_demand'])
        b2 = ws.cell(row=r, column=start_col + 2, value=data['direct_bu_supply'])
        b3 = ws.cell(row=r, column=start_col + 3, value=f"={get_column_letter(start_col+2)}{r}/{get_column_letter(start_col+1)}{r}" if data['direct_bu_demand'] > 0 else 0.0)

        for c in [b0, b1, b2, b3]:
            c.font = self.FONT_BODY
            c.fill = self.ZEBRA_FILL
            c.border = self.REGULAR_BORDER
        b0.alignment = self.ALIGN_LEFT
        b1.number_format = '#,##0'
        b1.alignment = self.ALIGN_RIGHT
        b2.number_format = '#,##0'
        b2.alignment = self.ALIGN_RIGHT
        b3.number_format = '0.0%'
        b3.alignment = self.ALIGN_RIGHT

        # Grand Total
        r += 1
        gt0 = ws.cell(row=r, column=start_col, value="Total Supply")
        gt1 = ws.cell(row=r, column=start_col + 1, value=f"=SUM({get_column_letter(start_col+1)}{r_rmg}:{get_column_letter(start_col+1)}{r_bu})")
        gt2 = ws.cell(row=r, column=start_col + 2, value=f"=SUM({get_column_letter(start_col+2)}{r_rmg}:{get_column_letter(start_col+2)}{r_bu})")
        gt3 = ws.cell(row=r, column=start_col + 3, value=f"={get_column_letter(start_col+2)}{r}/{get_column_letter(start_col+1)}{r}")

        for c in [gt0, gt1, gt2, gt3]:
            c.font = self.FONT_TOTAL
            c.fill = self.TOTAL_FILL
            c.border = self.TOTAL_BORDER

        gt0.alignment = self.ALIGN_LEFT
        gt1.number_format = '#,##0'
        gt1.alignment = self.ALIGN_RIGHT
        gt2.number_format = '#,##0'
        gt2.alignment = self.ALIGN_RIGHT
        gt3.number_format = '0.0%'
        gt3.alignment = self.ALIGN_RIGHT

        return r

    def _render_section4_matrix_table(self, ws, df: pd.DataFrame, start_col: int, start_row: int) -> int:
        """Renders Section 4: Cross Stream Mapping Matrix."""
        total_cols = len(df.columns) + 1  # Index + columns
        ws.merge_cells(start_row=start_row, start_column=start_col, end_row=start_row, end_column=start_col + total_cols - 1)
        hdr = ws.cell(row=start_row, column=start_col)
        hdr.value = "SECTION 4: CROSS STREAM MAPPING MATRIX"
        hdr.font = self.FONT_SECTION_TITLE
        hdr.fill = self.ACCENT_HEADER_FILL
        hdr.alignment = self.ALIGN_LEFT

        # Header Row
        r = start_row + 1
        lbl_cell = ws.cell(row=r, column=start_col, value="Demand Stream \\ Mapped Stream")
        lbl_cell.font = self.FONT_HEADER
        lbl_cell.fill = self.SECTION_HEADER_FILL
        lbl_cell.alignment = self.ALIGN_LEFT
        lbl_cell.border = self.REGULAR_BORDER

        for i, col_name in enumerate(df.columns):
            c_cell = ws.cell(row=r, column=start_col + 1 + i, value=col_name)
            c_cell.font = self.FONT_HEADER
            c_cell.fill = self.SECTION_HEADER_FILL if col_name != 'Total Mapped' else self.PRIMARY_HEADER_FILL
            c_cell.alignment = self.ALIGN_RIGHT
            c_cell.border = self.REGULAR_BORDER

        data_start_row = r + 1
        r += 1
        for idx_label, row_data in df.iterrows():
            row_stream_name = str(idx_label)
            r_label = ws.cell(row=r, column=start_col, value=row_stream_name)
            r_label.font = self.FONT_BODY_BOLD
            r_label.alignment = self.ALIGN_LEFT
            r_label.border = self.REGULAR_BORDER

            for c_idx, col_name in enumerate(df.columns):
                val = int(row_data[col_name])
                c_cell = ws.cell(row=r, column=start_col + 1 + c_idx)
                
                if col_name == 'Total Mapped':
                    # Dynamic row sum formula
                    start_let = get_column_letter(start_col + 1)
                    end_let = get_column_letter(start_col + len(df.columns) - 1)
                    c_cell.value = f"=SUM({start_let}{r}:{end_let}{r})"
                    c_cell.font = self.FONT_BODY_BOLD
                    c_cell.fill = self.TOTAL_FILL
                else:
                    c_cell.value = val
                    c_cell.font = self.FONT_BODY
                    # Highlight diagonal (Same-Stream Mapping)
                    if row_stream_name.lower() == col_name.lower() and val > 0:
                        c_cell.fill = self.DIAGONAL_MATCH_FILL

                c_cell.number_format = '#,##0'
                c_cell.alignment = self.ALIGN_RIGHT
                c_cell.border = self.REGULAR_BORDER

            r += 1

        # Column Grand Total Row (Total Allocated)
        data_end_row = r - 1
        gt_label = ws.cell(row=r, column=start_col, value="Total Allocated")
        gt_label.font = self.FONT_TOTAL
        gt_label.fill = self.TOTAL_FILL
        gt_label.border = self.TOTAL_BORDER
        gt_label.alignment = self.ALIGN_LEFT

        for c_idx, col_name in enumerate(df.columns):
            col_let = get_column_letter(start_col + 1 + c_idx)
            gt_cell = ws.cell(row=r, column=start_col + 1 + c_idx)
            if data_end_row >= data_start_row:
                gt_cell.value = f"=SUM({col_let}{data_start_row}:{col_let}{data_end_row})"
            else:
                gt_cell.value = 0
            gt_cell.font = self.FONT_TOTAL
            gt_cell.fill = self.TOTAL_FILL
            gt_cell.number_format = '#,##0'
            gt_cell.alignment = self.ALIGN_RIGHT
            gt_cell.border = self.TOTAL_BORDER

        return r

    def _render_rmg_requirement_sheet(self, ws: openpyxl.worksheet.worksheet.Worksheet) -> None:
        """
        Renders Sheet 2: RMG REQUIREMENT.
        Populates every transactional record preserving all 15 source columns without aggregation.
        """
        headers = [
            "BG",
            "ISU/HSU",
            "Project Name",
            "Stream",
            "Location",
            "Role",
            "Project SPOC Name",
            "Project SPOC Emp ID",
            "RMG Head",
            "RGS ID",
            "Demand Count",
            "Shared By",
            "Pending/Confirmed",
            "Supply Completed",
            "Batch"
        ]

        # Header Row
        for col_num, header_text in enumerate(headers, 1):
            cell = ws.cell(row=1, column=col_num, value=header_text)
            cell.font = self.FONT_HEADER
            cell.fill = self.PRIMARY_HEADER_FILL
            cell.alignment = self.ALIGN_CENTER
            cell.border = self.REGULAR_BORDER

        # Populate transactional rows
        for row_idx, (_, row) in enumerate(self.df_raw.iterrows(), start=2):
            is_zebra = (row_idx % 2 == 1)
            row_fill = self.ZEBRA_FILL if is_zebra else None

            for col_idx, col_name in enumerate(headers, start=1):
                val = row.get(col_name, '')
                cell = ws.cell(row=row_idx, column=col_idx)

                if col_name in ['Demand Count', 'Supply Completed']:
                    try:
                        cell.value = int(val)
                    except (ValueError, TypeError):
                        cell.value = 0
                    cell.number_format = '#,##0'
                    cell.alignment = self.ALIGN_RIGHT
                else:
                    cell.value = str(val) if val is not None else ''
                    cell.alignment = self.ALIGN_LEFT if col_name in ['Project Name', 'Location', 'Project SPOC Name'] else self.ALIGN_CENTER

                cell.font = self.FONT_BODY
                if row_fill:
                    cell.fill = row_fill
                cell.border = self.REGULAR_BORDER

        # Enable Auto-Filter across all data
        if len(self.df_raw) > 0:
            last_col_let = get_column_letter(len(headers))
            ws.auto_filter.ref = f"A1:{last_col_let}{len(self.df_raw) + 1}"

        # Freeze Header Row
        ws.freeze_panes = "A2"

        # Auto-fit columns
        self._auto_fit_columns(ws, max_cols=len(headers))

    def _auto_fit_columns(self, ws: openpyxl.worksheet.worksheet.Worksheet, max_cols: int) -> None:
        """Dynamically adjusts column widths with safety padding so text is never truncated."""
        for col in range(1, max_cols + 1):
            col_letter = get_column_letter(col)
            max_len = 0
            for row in range(1, min(ws.max_row + 1, 300)):
                cell = ws.cell(row=row, column=col)
                if cell.value:
                    val_str = str(cell.value)
                    # Ignore formula text when estimating width
                    if not val_str.startswith('='):
                        max_len = max(max_len, len(val_str))
            
            # Apply padding and clamp
            adjusted_width = max(max_len + 4, 12)
            adjusted_width = min(adjusted_width, 42)
            ws.column_dimensions[col_letter].width = adjusted_width

    # =========================================================================
    # 4. EXPORT UTILITIES
    # =========================================================================

    def export_to_bytes(self) -> io.BytesIO:
        """Exports the generated 2-sheet workbook as an in-memory BytesIO buffer."""
        wb = self.generate_workbook()
        buffer = io.BytesIO()
        wb.save(buffer)
        buffer.seek(0)
        return buffer

    def export_to_file(self, file_path: str) -> str:
        """Saves the generated 2-sheet workbook directly to the specified file path."""
        wb = self.generate_workbook()
        wb.save(file_path)
        logger.info(f"Talent Alignment Excel report saved successfully to {file_path}")
        return file_path
