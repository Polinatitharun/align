# Generated for training and recruitment management enhancements.

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('apis', '0003_remove_job_department_remove_job_description_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='Course',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=150, unique=True)),
                ('description', models.TextField(blank=True)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('owner', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='owned_courses', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['name'],
            },
        ),
        migrations.AddField(
            model_name='user',
            name='course',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='users', to='apis.course'),
        ),
        migrations.AddField(
            model_name='job',
            name='course',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='jobs', to='apis.course'),
        ),
        migrations.AddField(
            model_name='userinfo',
            name='course',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='trainee_infos', to='apis.course'),
        ),
        migrations.AddField(
            model_name='match',
            name='availability_percentage',
            field=models.FloatField(default=100.0),
        ),
        migrations.AddField(
            model_name='match',
            name='experience_percentage',
            field=models.FloatField(default=0.0),
        ),
        migrations.AddField(
            model_name='match',
            name='is_recommended',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='match',
            name='rank',
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='user',
            name='role',
            field=models.CharField(choices=[('trainee', 'Trainee'), ('ta', 'TA'), ('manager', 'Manager'), ('hr', 'HR'), ('admin', 'Admin'), ('interviewer', 'Interviewer'), ('course_owner', 'Course Owner')], max_length=20),
        ),
        migrations.AlterField(
            model_name='interviewlock',
            name='status',
            field=models.CharField(choices=[('locked', 'Locked for Interview'), ('selected', 'Selected'), ('rejected', 'Rejected'), ('mapped', 'Mapped'), ('unmapped', 'Unmapped'), ('offered', 'Offered'), ('joined', 'Joined'), ('cancelled', 'Cancelled')], default='locked', max_length=20),
        ),
        migrations.CreateModel(
            name='Notification',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('notification_type', models.CharField(choices=[('new_jd', 'New JD Created'), ('matches_found', 'Matching Candidates Found'), ('candidate_selected', 'Candidate Selected'), ('candidate_rejected', 'Candidate Rejected'), ('opening_filled', 'Opening Filled'), ('interview_scheduled', 'Interview Scheduled'), ('feedback_submitted', 'Interview Feedback Submitted'), ('backup_restore', 'Backup/Restore')], max_length=40)),
                ('title', models.CharField(max_length=200)),
                ('message', models.TextField()),
                ('payload', models.JSONField(blank=True, default=dict)),
                ('is_read', models.BooleanField(default=False)),
                ('email_sent', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('recipient', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='notifications', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='AuditLog',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('action', models.CharField(max_length=120)),
                ('entity_type', models.CharField(blank=True, max_length=80)),
                ('entity_id', models.CharField(blank=True, max_length=80)),
                ('previous_value', models.JSONField(blank=True, null=True)),
                ('new_value', models.JSONField(blank=True, null=True)),
                ('timestamp', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='audit_logs', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-timestamp'],
            },
        ),
    ]
