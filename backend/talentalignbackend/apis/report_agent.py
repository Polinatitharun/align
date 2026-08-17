"""
Hybrid AI Report Generator for Talent Align
Uses Ollama (localhost:11434) for human-like narratives with rule-based fallback.
"""

import logging
import json
import requests
from datetime import datetime
from typing import Dict, List, Any, Optional
from django.db.models import Count, Q
from .models import (
    Job, UserInfo, ProfileRecord, Match, InterviewLock, 
    Recommendation, Course, Notification, Strength, Weakness
)

logger = logging.getLogger(__name__)

OLLAMA_URL = "http://localhost:11434"
OLLAMA_GENERATE_URL = f"{OLLAMA_URL}/api/generate"
OLLAMA_TAGS_URL = f"{OLLAMA_URL}/api/tags"
OLLAMA_MODEL = "llama3:latest"


class ReportGenerator:
    """Hybrid report generator - Ollama LLM powered with rule-based fallback."""
    
    def __init__(self, batch_name=None):
        self.batch_name = batch_name
        self.ollama_available = self._check_ollama()
        self.report_sections = []
        logger.info(f"ReportGenerator initialized. Ollama available: {self.ollama_available}")
    
    def _check_ollama(self) -> bool:
        """Check if Ollama is running with llama3 model."""
        try:
            response = requests.get(OLLAMA_TAGS_URL, timeout=5)
            if response.status_code == 200:
                data = response.json()
                models = [m.get('name', '') for m in data.get('models', [])]
                return any(OLLAMA_MODEL in m for m in models)
            return False
        except requests.exceptions.ConnectionError:
            logger.warning("Ollama is not running at localhost:11434")
            return False
        except Exception as e:
            logger.warning(f"Ollama check failed: {e}")
            return False
    
    def generate_full_report(self) -> Dict[str, Any]:
        """Generate complete report with all sections."""
        
        # Gather all data
        data = self._gather_data()
        
        # Build context for LLM
        context = self._build_context(data)
        
        # Generate sections (try LLM, fallback to rules)
        sections = []
        sections.append(self._generate_section('executive_summary', 'Executive Summary', '📊', data, context))
        sections.append(self._generate_section('workforce_analysis', 'Workforce Analysis', '👥', data, context))
        sections.append(self._generate_section('demand_analysis', 'Demand Analysis', '📋', data, context))
        sections.append(self._generate_section('skill_gap_analysis', 'Skill Gap Analysis', '🎯', data, context))
        sections.append(self._generate_section('location_analysis', 'Location Analysis', '📍', data, context))
        sections.append(self._generate_section('pipeline_analysis', 'Pipeline Analysis', '🔄', data, context))
        sections.append(self._generate_section('batch_analysis', 'Batch Analysis', '📦', data, context))
        sections.append(self._generate_section('course_owner_analysis', 'Course Owner Performance', '✅', data, context))
        sections.append(self._generate_section('risk_assessment', 'Risk Assessment', '⚠️', data, context))
        sections.append(self._generate_section('recommendations', 'Recommendations', '💡', data, context))
        sections.append(self._generate_section('future_outlook', 'Future Outlook', '🔮', data, context))
        
        generator_type = 'LLM (Ollama - llama3)' if self.ollama_available else 'Rule-based (Ollama unavailable)'
        
        return {
            'report_title': f"Talent Align - HR Analytics Report ({self.batch_name or 'All Batches'})",
            'generated_at': datetime.now().isoformat(),
            'generator': generator_type,
            'sections': sections,
            'summary_stats': data['summary'],
        }
    
    def _generate_section(self, section_id: str, title: str, icon: str, data: Dict, context: str) -> Dict[str, Any]:
        """Generate section content - try LLM first, fallback to rules."""
        
        content = None
        source = 'rule-based'
        
        if self.ollama_available:
            try:
                content = self._generate_with_ollama(section_id, title, data, context)
                if content:
                    source = 'llm'
            except Exception as e:
                logger.warning(f"LLM failed for {section_id}: {e}")
                content = None
        
        if content is None:
            content = self._fallback_section(section_id, data)
        
        return {
            'section_id': section_id,
            'title': title,
            'icon': icon,
            'content': content,
            'source': source,
        }
    
    def _generate_with_ollama(self, section_id: str, title: str, data: Dict, context: str) -> str:
        """Generate narrative using Ollama directly."""
        
        section_data = self._extract_section_data(section_id, data)
        
        prompt = f"""You are a senior HR analytics expert at TCS analyzing a Talent Management System.

## SYSTEM CONTEXT
{context}

## DATA FOR {title.upper()}
{json.dumps(section_data, indent=2, default=str)}

## INSTRUCTIONS
Write a detailed, human-like analysis of {title}.
Use professional HR language with specific numbers from the data above.
Include:
1. Key observations (with exact figures)
2. What's working well
3. What needs attention
4. Actionable recommendations

Format: Use markdown with bullet points. Be concise but insightful (150-300 words).
Do NOT use placeholders like [insert]. Use real data from above."""
        
        payload = {
            "model": OLLAMA_MODEL,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": 0.3,
                "num_predict": 500,
            }
        }
        
        response = requests.post(OLLAMA_GENERATE_URL, json=payload, timeout=120)
        response.raise_for_status()
        result = response.json()
        return result.get('response', '').strip()
    
    def _extract_section_data(self, section_id: str, data: Dict) -> Dict:
        """Extract relevant data for each section."""
        summary = data['summary']
        locks = data['locks']
        matches = data['matches']
        recs = data['recommendations']
        
        section_data = {
            'executive_summary': {
                'summary': summary,
                'locks': locks,
                'matches': matches,
                'recommendations': recs,
            },
            'workforce_analysis': {
                'skill_supply': dict(sorted(data['skill_supply'].items(), key=lambda x: x[1], reverse=True)[:10]),
                'location_data': dict(sorted(data['location_data'].items(), key=lambda x: x[1], reverse=True)[:10]),
                'mapping': summary,
            },
            'demand_analysis': {
                'summary': summary,
            },
            'skill_gap_analysis': self._calculate_skill_gaps(data),
            'location_analysis': {
                'location_data': dict(sorted(data['location_data'].items(), key=lambda x: x[1], reverse=True)[:15]),
            },
            'pipeline_analysis': {
                'summary': summary,
                'locks': locks,
                'matches': matches,
            },
            'batch_analysis': {
                'batches': data['batches'],
            },
            'course_owner_analysis': {
                'recommendations': recs,
            },
            'risk_assessment': {
                'summary': summary,
                'locks': locks,
                'matches': matches,
                'recommendations': recs,
            },
            'recommendations': {
                'summary': summary,
                'locks': locks,
                'matches': matches,
                'recommendations': recs,
            },
            'future_outlook': {
                'summary': summary,
            },
        }
        
        return section_data.get(section_id, data)
    
    def _calculate_skill_gaps(self, data: Dict) -> List[Dict]:
        """Calculate skill gaps."""
        skill_supply = data['skill_supply']
        skill_demand = data['skill_demand']
        
        gaps = []
        for skill, demand in skill_demand.items():
            supply = skill_supply.get(skill, 0)
            gap = demand - supply
            gaps.append({
                'skill': skill,
                'demand': demand,
                'supply': supply,
                'gap': gap,
                'severity': 'critical' if gap > supply else 'moderate' if gap > 0 else 'ok',
            })
        
        gaps.sort(key=lambda x: x['gap'], reverse=True)
        return gaps[:15]
    
    def _build_context(self, data: Dict) -> str:
        """Build context string for LLM."""
        summary = data['summary']
        locks = data['locks']
        matches = data['matches']
        recs = data['recommendations']
        
        return f"""
SYSTEM OVERVIEW:
- Batch: {self.batch_name or 'All Batches'}
- Total Trainees: {summary['total_trainees']}
- Total Jobs: {summary['total_jobs']} ({summary['active_jobs']} active)
- Total Openings: {summary['total_openings']}
- Filled Positions: {summary['total_filled']}
- Fill Rate: {summary['fill_rate']}%
- Mapped Trainees: {summary['mapped_count']} ({summary['mapping_rate']}%)
- Unmapped Trainees: {summary['unmapped_count']}
- Interview Locked: {locks['locked']}
- Selected: {locks['selected']} ({locks['selection_rate']}% selection rate)
- Rejected: {locks['rejected']}
- Total Matches: {matches['total']} ({matches['coverage']}% coverage)
- Perfect Matches: {matches['perfect']}
- Skills Only: {matches['skills_only']}
- Location Only: {matches['location_only']}
- Nearby: {matches['nearby']}
- Pending Recommendations: {recs['pending']}
- Accepted Recommendations: {recs['accepted']} ({recs['acceptance_rate']}% acceptance)
- Rejected Recommendations: {recs['rejected']}
"""
    
    # ── FALLBACK METHODS (used when LLM unavailable) ──
    
    def _fallback_section(self, section_id: str, data: Dict) -> str:
        """Rule-based fallback for each section."""
        fallback_methods = {
            'executive_summary': self._fb_executive_summary,
            'workforce_analysis': self._fb_workforce_analysis,
            'demand_analysis': self._fb_demand_analysis,
            'skill_gap_analysis': self._fb_skill_gap_analysis,
            'location_analysis': self._fb_location_analysis,
            'pipeline_analysis': self._fb_pipeline_analysis,
            'batch_analysis': self._fb_batch_analysis,
            'course_owner_analysis': self._fb_course_owner_analysis,
            'risk_assessment': self._fb_risk_assessment,
            'recommendations': self._fb_recommendations,
            'future_outlook': self._fb_future_outlook,
        }
        
        method = fallback_methods.get(section_id)
        return method(data) if method else f"## {section_id}\n\nAnalysis unavailable."
    
    def _fb_executive_summary(self, data) -> str:
        summary = data['summary']
        locks = data['locks']
        matches = data['matches']
        
        health = self._health_score(data)
        
        return f"""
## EXECUTIVE SUMMARY

The Talent Align platform currently manages **{summary['total_trainees']} trainees** with **{summary['total_jobs']} job positions** ({summary['active_jobs']} active).

**Current State:**
- Workforce Utilization: {summary['mapping_rate']}% ({summary['mapped_count']} mapped, {summary['unmapped_count']} unmapped)
- Job Fill Rate: {summary['fill_rate']}% ({summary['total_filled']}/{summary['total_openings']} filled)
- Interview Conversion: {locks['selection_rate']}% ({locks['selected']}/{locks['locked']} selected)
- Match Coverage: {matches['coverage']}% ({matches['total']} matches)

**Overall Health:** {'🟢 EXCELLENT' if health >= 70 else '🟡 FAIR' if health >= 40 else '🔴 CRITICAL'} ({health}%)
"""
    
    def _fb_workforce_analysis(self, data) -> str:
        summary = data['summary']
        top_skills = sorted(data['skill_supply'].items(), key=lambda x: x[1], reverse=True)[:10]
        top_locations = sorted(data['location_data'].items(), key=lambda x: x[1], reverse=True)[:10]
        
        skills_str = '\n'.join([f"- {skill}: {count} trainees" for skill, count in top_skills]) or "- No skill data"
        loc_str = '\n'.join([f"- {loc}: {count} trainees" for loc, count in top_locations]) or "- No location data"
        
        return f"""
## WORKFORCE ANALYSIS

### Skill Inventory (Top 10)
{skills_str}

### Location Distribution (Top 10)
{loc_str}

### Mapping Status
- Mapped: {summary['mapped_count']} ({summary['mapping_rate']}%)
- Unmapped: {summary['unmapped_count']}
"""
    
    def _fb_demand_analysis(self, data) -> str:
        summary = data['summary']
        remaining = summary['total_openings'] - summary['total_filled']
        
        return f"""
## DEMAND ANALYSIS

- Total Jobs: {summary['total_jobs']} ({summary['active_jobs']} active)
- Total Openings: {summary['total_openings']}
- Filled: {summary['total_filled']}
- Remaining: {remaining}
- Fill Rate: {summary['fill_rate']}%

{'⚠️ Demand exceeds supply. Consider sourcing more candidates.' if summary['fill_rate'] < 50 else 'Demand and supply are balanced.' if summary['fill_rate'] < 80 else '✅ Demand is well-covered.'}
"""
    
    def _fb_skill_gap_analysis(self, data) -> str:
        gaps = self._calculate_skill_gaps(data)
        
        if not gaps or all(g['gap'] <= 0 for g in gaps):
            return "## SKILL GAP ANALYSIS\n\n✅ No critical skill gaps identified."
        
        critical = [g for g in gaps if g['gap'] > 0][:10]
        lines = []
        for g in critical:
            severity = '🔴' if g['gap'] > g['supply'] else '🟡'
            lines.append(f"- {severity} **{g['skill']}**: Demand {g['demand']}, Supply {g['supply']}, Gap {g['gap']}")
        
        return f"""
## SKILL GAP ANALYSIS

### Skill Shortages
{chr(10).join(lines)}

### Most Critical Gap
The most critical skill gap is **{critical[0]['skill']}** with a shortage of {critical[0]['gap']} positions.
"""
    
    def _fb_location_analysis(self, data) -> str:
        locations = sorted(data['location_data'].items(), key=lambda x: x[1], reverse=True)[:10]
        
        if not locations:
            return "## LOCATION ANALYSIS\n\nNo location data available."
        
        lines = [f"- {loc}: {count} trainees" for loc, count in locations]
        
        return f"""
## LOCATION ANALYSIS

### Trainee Distribution
{chr(10).join(lines)}

### Insight
Trainees are concentrated in the top locations. For jobs elsewhere, consider relocation incentives.
"""
    
    def _fb_pipeline_analysis(self, data) -> str:
        summary = data['summary']
        locks = data['locks']
        matches = data['matches']
        
        return f"""
## PIPELINE ANALYSIS

| Stage | Count | Rate |
|-------|-------|------|
| Trainees | {summary['total_trainees']} | - |
| Matches | {matches['total']} | {matches['coverage']}% |
| Locked | {locks['locked']} | {round(locks['locked']/max(1,matches['total'])*100,1)}% |
| Selected | {locks['selected']} | {locks['selection_rate']}% |
| Mapped | {summary['mapped_count']} | {summary['mapping_rate']}% |

### Match Quality
- Perfect: {matches['perfect']} | Skills Only: {matches['skills_only']} | Location Only: {matches['location_only']} | Nearby: {matches['nearby']}
"""
    
    def _fb_batch_analysis(self, data) -> str:
        batches = data['batches']
        
        if not batches:
            return "## BATCH ANALYSIS\n\nNo batch data available."
        
        lines = []
        for b in batches:
            status = '🟢' if b['rate'] >= 70 else '🟡' if b['rate'] >= 40 else '🔴'
            lines.append(f"- {status} **{b['name']}**: {b['total']} trainees, {b['mapped']} mapped ({b['rate']}%)")
        
        return f"""
## BATCH ANALYSIS

{chr(10).join(lines)}
"""
    
    def _fb_course_owner_analysis(self, data) -> str:
        recs = data['recommendations']
        
        return f"""
## COURSE OWNER PERFORMANCE

- Total: {recs['total']}
- Pending: {recs['pending']}
- Accepted: {recs['accepted']} ({recs['acceptance_rate']}%)
- Rejected: {recs['rejected']}

{'⚠️ High number of pending recommendations - follow up needed.' if recs['pending'] > 10 else '✅ Course owners are responsive.'}
"""
    
    def _fb_risk_assessment(self, data) -> str:
        summary = data['summary']
        locks = data['locks']
        matches = data['matches']
        recs = data['recommendations']
        
        risks = []
        
        if summary['unmapped_count'] > summary['mapped_count']:
            risks.append("🔴 HIGH: More than 50% trainees unmapped")
        if locks['locked'] > 20 and locks['selection_rate'] < 30:
            risks.append("🟡 MODERATE: Low interview conversion")
        if recs['pending'] > 20:
            risks.append("🟡 MODERATE: " + str(recs['pending']) + " recommendations pending")
        if matches['coverage'] < 30:
            risks.append("🔴 HIGH: Match coverage below 30%")
        
        if not risks:
            risks.append("🟢 LOW: No critical risks identified")
        
        return f"""
## RISK ASSESSMENT

{chr(10).join(risks)}
"""
    
    def _fb_recommendations(self, data) -> str:
        summary = data['summary']
        locks = data['locks']
        matches = data['matches']
        
        recs = []
        if summary['mapping_rate'] < 60:
            recs.append("1. Increase mapping rate - review unmapped trainees")
        if summary['unmapped_count'] > 30:
            recs.append("2. Create more jobs to utilize available talent")
        if locks['selection_rate'] < 40 and locks['locked'] > 0:
            recs.append("3. Review interview process")
        if matches['coverage'] < 50:
            recs.append("4. Run matching engine for active jobs")
        
        if not recs:
            recs.append("1. Maintain current performance")
        
        return f"""
## RECOMMENDATIONS

{chr(10).join(recs)}
"""
    
    def _fb_future_outlook(self, data) -> str:
        summary = data['summary']
        
        return f"""
## FUTURE OUTLOOK

- Workforce: {summary['total_trainees']} trainees
- Open Positions: {summary['total_openings'] - summary['total_filled']}
- Fill Rate: {summary['fill_rate']}%

{'✅ On track to fill all openings within 1-2 weeks.' if summary['fill_rate'] > 80 else '⚡ On track to fill within 3-4 weeks.' if summary['fill_rate'] > 50 else '🔴 Urgent action needed - fill rate below 50%.'}
"""
    
    def _health_score(self, data) -> int:
        """Calculate overall health score (0-100)."""
        summary = data['summary']
        locks = data['locks']
        matches = data['matches']
        
        score = 0
        if summary['mapping_rate'] >= 70: score += 25
        elif summary['mapping_rate'] >= 40: score += 15
        else: score += 5
        
        if summary['fill_rate'] >= 70: score += 25
        elif summary['fill_rate'] >= 40: score += 15
        else: score += 5
        
        if locks['selection_rate'] >= 50: score += 25
        elif locks['selection_rate'] >= 30: score += 15
        else: score += 5
        
        if matches['coverage'] >= 60: score += 25
        elif matches['coverage'] >= 30: score += 15
        else: score += 5
        
        return score
    
    def _gather_data(self) -> Dict[str, Any]:
        """Gather all data needed for report."""
        
        trainees_qs = ProfileRecord.objects.select_related('userInfo').prefetch_related('strengths', 'weaknesses')
        jobs_qs = Job.objects.all()
        locks_qs = InterviewLock.objects.select_related('trainee', 'job', 'assigned_to')
        matches_qs = Match.objects.select_related('job_ref', 'trainee_ref')
        recs_qs = Recommendation.objects.all()
        
        if self.batch_name:
            trainees_qs = trainees_qs.filter(batch_name=self.batch_name)
            jobs_qs = jobs_qs.filter(batch_name=self.batch_name)
            locks_qs = locks_qs.filter(Q(job__batch_name=self.batch_name) | Q(trainee__batch_name=self.batch_name))
            matches_qs = matches_qs.filter(Q(job_ref__batch_name=self.batch_name) | Q(trainee_ref__batch_name=self.batch_name))
        
        total_trainees = trainees_qs.count()
        total_jobs = jobs_qs.count()
        active_jobs = jobs_qs.filter(status='active').count()
        total_openings = sum(j.openings for j in jobs_qs)
        total_filled = sum(j.filled for j in jobs_qs)
        mapped_count = trainees_qs.filter(userInfo__isMapped=True).count()
        
        skill_supply = {}
        for trainee in trainees_qs.prefetch_related('strengths'):
            for strength in trainee.strengths.all():
                skill = strength.courseName
                skill_supply[skill] = skill_supply.get(skill, 0) + 1
        
        skill_demand = {}
        for job in jobs_qs:
            for skill in (job.skills or '').split(','):
                skill = skill.strip()
                if skill:
                    skill_demand[skill] = skill_demand.get(skill, 0) + job.openings
        
        location_data = {}
        for trainee in trainees_qs:
            loc = trainee.userInfo.preferred_location_1 or trainee.userInfo.location or 'Unknown'
            location_data[loc] = location_data.get(loc, 0) + 1
        
        locked_count = locks_qs.filter(status='locked').count()
        selected_count = locks_qs.filter(status='selected').count()
        rejected_count = locks_qs.filter(status='rejected').count()
        cancelled_count = locks_qs.filter(status='cancelled').count()
        
        total_matches = matches_qs.count()
        perfect_matches = matches_qs.filter(bucket='PERFECT_MATCH').count()
        skills_only = matches_qs.filter(bucket='SKILLS_ONLY').count()
        location_only = matches_qs.filter(bucket='LOCATION_ONLY').count()
        nearby = matches_qs.filter(bucket='NEARBY').count()
        
        pending_recs = recs_qs.filter(status='Pending').count()
        accepted_recs = recs_qs.filter(status='Accepted').count()
        rejected_recs = recs_qs.filter(status='Rejected').count()
        
        batches = trainees_qs.values_list('batch_name', flat=True).distinct()
        batch_stats = []
        for batch in batches:
            if not batch:
                continue
            batch_trainees = trainees_qs.filter(batch_name=batch)
            batch_mapped = batch_trainees.filter(userInfo__isMapped=True).count()
            batch_stats.append({
                'name': batch,
                'total': batch_trainees.count(),
                'mapped': batch_mapped,
                'rate': round((batch_mapped / batch_trainees.count() * 100), 1) if batch_trainees.count() > 0 else 0,
            })
        
        return {
            'summary': {
                'total_trainees': total_trainees,
                'total_jobs': total_jobs,
                'active_jobs': active_jobs,
                'total_openings': total_openings,
                'total_filled': total_filled,
                'fill_rate': round((total_filled / total_openings * 100), 1) if total_openings > 0 else 0,
                'mapped_count': mapped_count,
                'mapping_rate': round((mapped_count / total_trainees * 100), 1) if total_trainees > 0 else 0,
                'unmapped_count': total_trainees - mapped_count,
            },
            'skill_supply': skill_supply,
            'skill_demand': skill_demand,
            'location_data': location_data,
            'locks': {
                'locked': locked_count,
                'selected': selected_count,
                'rejected': rejected_count,
                'cancelled': cancelled_count,
                'selection_rate': round((selected_count / locked_count * 100), 1) if locked_count > 0 else 0,
            },
            'matches': {
                'total': total_matches,
                'perfect': perfect_matches,
                'skills_only': skills_only,
                'location_only': location_only,
                'nearby': nearby,
                'coverage': round((total_matches / total_trainees * 100), 1) if total_trainees > 0 else 0,
            },
            'recommendations': {
                'total': recs_qs.count(),
                'pending': pending_recs,
                'accepted': accepted_recs,
                'rejected': rejected_recs,
                'acceptance_rate': round((accepted_recs / recs_qs.count() * 100), 1) if recs_qs.count() > 0 else 0,
            },
            'batches': batch_stats,
        }