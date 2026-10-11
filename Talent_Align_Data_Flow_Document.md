# Talent Align - Data Flow & User Operations Document

## Project Overview
**Talent Align** is a comprehensive talent management system that matches trainees to job opportunities using AI-driven matching algorithms. The system serves multiple user roles with distinct workflows and permissions.

---

## User Roles & Permissions

### 1. **Admin**
- **Dashboard**: `AdminDashboard.jsx`
- **Permissions**: Full system control
- **Operations**:
  - User management (create, edit, delete, activate/deactivate)
  - Bulk user operations via Excel upload
  - Password reset capabilities
  - System-wide user statistics and analytics
  - DECO integration management

### 2. **HR (Human Resources)**
- **Dashboard**: `DashboardHR.jsx`
- **Permissions**: Job and interview management
- **Operations**:
  - Job creation, editing, and management
  - Interview scheduling and assignment
  - Interviewer management
  - Candidate recommendation review
  - Interview feedback collection
  - Report generation (Excel exports)

### 3. **Manager**
- **Dashboard**: `DashboardManager.jsx`
- **Permissions**: Team and batch oversight
- **Operations**:
  - Batch-specific trainee management
  - Job-trainee matching analysis
  - Interview lock management
  - Performance analytics and insights
  - Skill gap analysis
  - Demand-supply analytics
  - Team chat sessions

### 4. **Associate/Trainee**
- **Dashboard**: `AssociateDashbaord.jsx`, `DashboardTrainee.jsx`
- **Permissions**: Self-service operations
- **Operations**:
  - Profile management and self-assessment
  - Job browsing and applications
  - Skill gap analysis
  - AI-powered career suggestions
  - Interview preparation (Q&A generation)
  - Course completion tracking
  - Upskill course recommendations

### 5. **Team Lead (TA)**
- **Dashboard**: `DashboardTeamLead.jsx` (referenced in active files)
- **Permissions**: Limited team oversight
- **Operations**:
  - Team member monitoring
  - Basic reporting capabilities

### 6. **Interviewer**
- **Dashboard**: `interviewDashbaord.jsx`
- **Permissions**: Interview-specific operations
- **Operations**:
  - View assigned interviews
  - Submit interview feedback
  - Candidate evaluation
  - Technical skills assessment

---

## Data Models & Relationships

### Core Entities

#### User Model
```python
ROLE_CHOICES = (
    ('trainee', 'Trainee'),
    ('ta', 'TA'),
    ('manager', 'Manager'),
    ('hr', 'HR'),
    ('admin', 'Admin'),
    ('interviewer','Interviewer')
)
```

#### Job Model
- **Fields**: title, department, location, openings, status, requirements, techSkills, softSkills
- **Status**: active, inactive, filled, expired
- **Batch-specific**: Jobs can be batch-specific or public

#### ProfileRecord Model
- **Linked to**: UserInfo
- **Contains**: upskillCourses, certificates, batchRank, groupRank, dpi
- **Relationships**: Strengths, Weaknesses, Matches, InterviewLocks

#### Match Model
- **Buckets**: PERFECT_MATCH, SKILLS_ONLY, LOCATION_ONLY, NEARBY, NO_MATCH
- **Metrics**: skills_percentage, location_percentage, total_percentage
- **Geographic**: Distance calculation using Haversine formula

#### InterviewLock Model
- **Status**: locked, selected, rejected, cancelled
- **Workflow**: Lock Interview -> Assign Interviewer -> Conduct Interview -> Submit Feedback

---

## Key Data Flows

### 1. **Authentication Flow**
```
Login.jsx -> API Login -> JWT Token -> Role-based Dashboard Routing
```

### 2. **Job Matching Flow**
```
Matching Engine -> Skills Analysis -> Location Analysis -> Match Scoring -> Bucket Assignment
```

### 3. **Interview Process Flow**
```
Manager/HR selects candidates -> Lock Interview -> Assign Interviewer -> Conduct Interview -> Submit Feedback -> Update Status
```

### 4. **Trainee Self-Service Flow**
```
Profile Update -> AI Analysis -> Skill Gap Identification -> Course Recommendations -> Job Suggestions
```

---

## API Endpoints Structure

### Authentication
- `POST /login/` - User authentication with JWT

### User Management
- `GET /users/` - List users (role-filtered)
- `POST /users/add/` - Create new user
- `POST /users/upload-excel/` - Bulk user creation
- `PUT /users/{id}/edit/` - Edit user
- `POST /users/reset-password/` - Reset password

### Job Management
- `GET /jobs/` - List jobs (batch-filtered)
- `POST /jobs/` - Create job
- `PUT /jobs/{id}/` - Update job
- `POST /jobs/upload-excel/` - Bulk job creation

### Matching & Recommendations
- `POST /run-matching-engine/` - Execute matching algorithm
- `GET /matches/{job_id}/` - Get job matches
- `GET /trainee-matches/{trainee_id}/` - Get trainee matches
- `GET /jobs/recommendations/` - Get recommendations

### Interview Management
- `GET /interview-locks/` - List interview locks
- `POST /interview-locks/bulk_create/` - Create interview locks
- `POST /interview-locks/{id}/submit_feedback/` - Submit feedback

### Reports & Analytics
- `GET /reports/{type}/` - Download reports
- `GET /analytics/` - Get analytics data

---

## Technology Stack

### Frontend
- **Framework**: React.js
- **UI Components**: Lucide React Icons
- **Charts**: Recharts
- **Styling**: CSS Modules
- **HTTP Client**: Axios
- **Notifications**: Sonner Toast

### Backend
- **Framework**: Django REST Framework
- **Database**: SQLite (db.sqlite3)
- **Authentication**: JWT (SimpleJWT)
- **AI/ML**: LangChain (Ollama integration)
- **File Processing**: pandas, openpyxl, docx

### Key Features
- **Geographic Matching**: Haversine distance calculation
- **AI Integration**: LLM-powered suggestions and analysis
- **Batch Processing**: Excel/Word bulk operations
- **Real-time Updates**: WebSocket-ready architecture
- **Role-based Access Control**: JWT authentication with role validation

---

## User Workflow Summary

### Admin Workflow
1. Login with admin credentials
2. Manage user accounts (create, edit, delete)
3. Monitor system health and user statistics
4. Handle DECO integration
5. Perform bulk operations

### HR Workflow
1. Login with HR credentials
2. Create and manage job postings
3. Review candidate recommendations
4. Schedule and assign interviews
5. Generate reports and analytics

### Manager Workflow
1. Login with manager credentials
2. Select batch for analysis
3. Review job-trainee matches
4. Monitor team performance
5. Conduct interview planning
6. Analyze skill gaps and trends

### Trainee Workflow
1. Login with trainee credentials
2. Update profile and self-assessment
3. Browse available jobs
4. Receive AI-powered recommendations
5. Track skill development progress
6. Prepare for interviews

### Interviewer Workflow
1. Login with interviewer credentials
2. View assigned interview schedule
3. Conduct interviews
4. Submit detailed feedback
5. Evaluate technical and soft skills

---

## Key Business Logic

### Matching Algorithm
1. **Skills Matching**: Calculate percentage overlap between job requirements and trainee skills
2. **Location Matching**: Use geographic coordinates to calculate proximity
3. **Batch Respect**: Only match within same batch (if specified)
4. **Score Calculation**: Combine skills and location scores for overall match percentage

### Interview Process
1. **Lock Creation**: Prevent multiple interviews for same candidate-job pair
2. **Assignment**: Assign qualified interviewers based on availability
3. **Feedback Collection**: Structured evaluation with technical and behavioral assessment
4. **Status Updates**: Automated workflow progression based on feedback

### AI Integration
1. **Career Path Suggestions**: LLM-powered recommendations based on profile
2. **Interview Questions**: AI-generated relevant questions
3. **Skill Gap Analysis**: Automated identification of development areas
4. **Course Recommendations**: Personalized learning paths

---

## Security & Access Control

### Authentication
- JWT-based authentication
- Role-based access control
- Session management with expiry

### Data Protection
- Role-specific data filtering
- Batch-based data isolation
- Secure file upload handling
- Input validation and sanitization

### Audit Trail
- User activity logging
- Interview status tracking
- System change history
- Performance metrics collection

---

## Integration Points

### External Systems
- **DECO**: Trainee data synchronization
- **Email**: Notification system
- **File Storage**: Document and image handling

### Internal Services
- **Matching Engine**: Core algorithm service
- **AI Service**: LLM integration for suggestions
- **Report Service**: Analytics and reporting
- **Notification Service**: Real-time updates

---

## Performance Considerations

### Database Optimization
- Indexed queries for fast lookups
- Batch processing for large datasets
- Caching for frequently accessed data

### Frontend Performance
- Lazy loading for large datasets
- Optimized component rendering
- Efficient state management

### Scalability
- Microservice-ready architecture
- Asynchronous processing for heavy operations
- Load balancing capabilities

---

## Future Enhancements

### Planned Features
- Advanced analytics dashboard
- Mobile application
- Enhanced AI capabilities
- Integration with HR systems
- Real-time collaboration tools

### Technical Improvements
- Database migration to PostgreSQL
- Microservices architecture
- Enhanced security features
- Performance optimization
- Cloud deployment readiness

---

*Document generated on: April 21, 2026*
*System Version: align-version6*
*Analysis Scope: Complete workspace review*
