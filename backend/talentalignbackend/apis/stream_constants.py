"""
stream_constants.py
Enterprise Stream Standardization & Normalization Module for Talent Align.
"""

from typing import Optional, List, Dict

# The 10 Allowed Enterprise Streams
ALLOWED_STREAMS: List[str] = [
    'AI Engineering',
    'Angular',
    'Devops',
    'DotNet',
    'PLSQL',
    'SpringBoot',
    'Test Automation',
    'Cloud',
    'Cyber Security',
    'Data Engineering',
]

# Canonical lookup mapping (lowercase normalized -> Canonical display name)
CANONICAL_STREAM_LOOKUP: Dict[str, str] = {
    s.lower(): s for s in ALLOWED_STREAMS
}

# Synonyms and alias keyword mappings to the 10 standard streams
STREAM_SYNONYMS: Dict[str, List[str]] = {
    'AI Engineering': [
        'ai engineering', 'ai', 'artificial intelligence', 'machine learning', 'ml', 
        'deep learning', 'genai', 'generative ai', 'llm', 'nlp', 'computer vision', 
        'data science / ai', 'ai engineer', 'ai/ml', 'prompt engineering', 'neural networks'
    ],
    'Angular': [
        'angular', 'angularjs', 'angular.js', 'angular 2+', 'angular framework', 
        'ngrx', 'rxjs', 'typescript with angular', 'angular developer', 'angular frontend'
    ],
    'Devops': [
        'devops', 'dev ops', 'ci/cd', 'docker', 'kubernetes', 'jenkins', 'terraform', 
        'ansible', 'helm', 'site reliability', 'sre', 'gitops', 'devsecops', 'cloudops'
    ],
    'DotNet': [
        'dotnet', 'dot net', '.net', 'c#', 'csharp', 'asp.net', '.net core', 
        'dotnet core', 'vb.net', 'c# .net', 'wcf', 'wpf', 'entity framework'
    ],
    'PLSQL': [
        'plsql', 'pl/sql', 'pl-sql', 'oracle plsql', 'sql developer', 'oracle database', 
        't-sql', 'tsql', 'stored procedures', 'oracle pl/sql', 'pl sql developer'
    ],
    'SpringBoot': [
        'springboot', 'spring boot', 'java springboot', 'java spring boot', 'spring', 
        'spring framework', 'spring mvc', 'core java & spring boot', 'java backend', 
        'spring microservices', 'java spring', 'hibernate/spring'
    ],
    'Test Automation': [
        'test automation', 'automation testing', 'automation', 'qa automation', 'selenium', 
        'cypress', 'playwright', 'appium', 'junit', 'testng', 'cucumber', 'testing automation', 
        'qa', 'sdet', 'selenium with java', 'selenium with python', 'api automation'
    ],
    'Cloud': [
        'cloud', 'aws', 'azure', 'gcp', 'google cloud', 'cloud architecture', 
        'amazon web services', 'microsoft azure', 'cloud computing', 'cloud infrastructure'
    ],
    'Cyber Security': [
        'cyber security', 'cybersecurity', 'infosec', 'information security', 'network security', 
        'soc', 'penetration testing', 'ethical hacking', 'iam', 'appsec', 'security analyst'
    ],
    'Data Engineering': [
        'data engineering', 'data engineer', 'etl', 'data pipeline', 'spark', 'pyspark', 
        'hadoop', 'kafka', 'bigquery', 'snowflake', 'databricks', 'data warehouse', 
        'airflow', 'dbt', 'sql server integration services', 'ssis'
    ],
}

# Technical skill dictionary per stream for auto-completion & matching
STREAM_SKILL_KEYWORDS: Dict[str, List[str]] = {
    'AI Engineering': ['Python', 'PyTorch', 'TensorFlow', 'Scikit-Learn', 'GenAI', 'LLM', 'LangChain', 'Prompt Engineering', 'NLP', 'Computer Vision'],
    'Angular': ['Angular', 'TypeScript', 'RxJS', 'NgRx', 'JavaScript', 'HTML5', 'CSS3', 'Bootstrap', 'REST APIs'],
    'Devops': ['Docker', 'Kubernetes', 'CI/CD', 'Jenkins', 'Terraform', 'Ansible', 'Linux', 'Git', 'Bash', 'AWS DevOps'],
    'DotNet': ['C#', '.NET Core', 'ASP.NET Core', 'Entity Framework', 'LINQ', 'SQL Server', 'Web API', 'Microservices'],
    'PLSQL': ['Oracle PL/SQL', 'SQL', 'Stored Procedures', 'Triggers', 'Database Tuning', 'ETL', 'Packages', 'Cursors'],
    'SpringBoot': ['Java', 'Spring Boot', 'Spring Data JPA', 'Microservices', 'Hibernate', 'RESTful APIs', 'Maven', 'JUnit'],
    'Test Automation': ['Selenium', 'Java/Python for QA', 'Cypress', 'Playwright', 'TestNG', 'Cucumber BDD', 'API Testing', 'Postman'],
    'Cloud': ['AWS', 'Microsoft Azure', 'GCP', 'Cloud Architecture', 'IAM', 'EC2/S3', 'Serverless/Lambda', 'CloudFormation'],
    'Cyber Security': ['Vulnerability Assessment', 'Penetration Testing', 'SIEM', 'SOC', 'Network Security', 'Cryptography', 'IAM', 'OWASP'],
    'Data Engineering': ['Apache Spark', 'PySpark', 'SQL', 'Kafka', 'Databricks', 'Snowflake', 'Airflow', 'Data Warehousing', 'ETL'],
}

# JD Source / Shared By options
SHARED_BY_CHOICES = (
    ('Direct BU', 'Direct BU'),
    ('RMG', 'RMG'),
)


def normalize_to_standard_stream(raw_value: Optional[str]) -> str:
    """
    Normalizes any raw stream name, skill string, or alias into one of the 10
    canonical ALLOWED_STREAMS. If no strong match is found, defaults to 'Others'.
    """
    if not raw_value:
        return 'Others'
    
    cleaned = str(raw_value).strip().lower()
    
    # 1. Direct canonical check
    if cleaned in CANONICAL_STREAM_LOOKUP:
        return CANONICAL_STREAM_LOOKUP[cleaned]
    
    # 2. Match against defined synonyms
    for stream_name, synonyms in STREAM_SYNONYMS.items():
        for syn in synonyms:
            if syn == cleaned:
                return stream_name
            # Check for word boundary containment
            if len(syn) > 2 and (f" {syn} " in f" {cleaned} " or cleaned.startswith(f"{syn} ") or cleaned.endswith(f" {syn}")):
                return stream_name
                
    # 3. Substring matching for multi-word or compound names
    for stream_name, synonyms in STREAM_SYNONYMS.items():
        for syn in synonyms:
            if len(syn) >= 3 and syn in cleaned:
                return stream_name

    return 'Others'


def is_valid_stream(stream_name: Optional[str]) -> bool:
    """Returns True if the stream is one of the 10 allowed streams or 'Others'."""
    if not stream_name:
        return False
    return stream_name in ALLOWED_STREAMS or stream_name == 'Others'
