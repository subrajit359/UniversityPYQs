from datetime import datetime
from app import db
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash

class User(UserMixin, db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256))
    first_name = db.Column(db.String(100))
    last_name = db.Column(db.String(100))
    is_active = db.Column(db.Boolean, default=True)
    is_admin = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    bookmarks = db.relationship('Bookmark', backref='user', lazy=True, cascade='all, delete-orphan')
    uploaded_papers = db.relationship('Paper', backref='uploader', foreign_keys='Paper.uploaded_by', lazy=True)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def __repr__(self):
        return f'<User {self.username}>'

class Paper(db.Model):
    __tablename__ = 'papers'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    subject = db.Column(db.String(100), nullable=False)
    year = db.Column(db.Integer, nullable=False)
    semester = db.Column(db.String(50), nullable=False)
    college = db.Column(db.String(200))
    course = db.Column(db.String(100))
    exam_type = db.Column(db.String(50), default='Regular')
    
    # Cloudinary integration fields
    cloudinary_public_id = db.Column(db.String(500))
    cloudinary_url = db.Column(db.String(500))
    cloudinary_resource_type = db.Column(db.String(50))
    file_format = db.Column(db.String(10))
    file_size = db.Column(db.Integer)
    
    # Legacy fields
    download_link = db.Column(db.String(500))
    file_path = db.Column(db.String(500))
    cloud_url = db.Column(db.String(500))
    
    # Metadata
    uploaded_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    upload_date = db.Column(db.DateTime, default=datetime.utcnow)
    download_count = db.Column(db.Integer, default=0)
    is_active = db.Column(db.Boolean, default=True)
    is_approved = db.Column(db.Boolean, default=False)
    approval_date = db.Column(db.DateTime)
    approved_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    rejection_reason = db.Column(db.Text)
    
    # Relationships
    bookmarks = db.relationship('Bookmark', backref='paper', lazy=True, cascade='all, delete-orphan')
    approver = db.relationship('User', foreign_keys=[approved_by])
    
    def increment_download_count(self):
        self.download_count += 1
        db.session.commit()
    
    def approve(self, admin_user):
        self.is_approved = True
        self.approval_date = datetime.utcnow()
        self.approved_by = admin_user.id
        self.rejection_reason = None
        db.session.commit()
    
    def reject(self, admin_user, reason):
        self.is_approved = False
        self.approval_date = None
        self.approved_by = admin_user.id
        self.rejection_reason = reason
        db.session.commit()
    
    def get_download_url(self):
        """Get the appropriate download URL"""
        if self.cloudinary_url:
            return self.cloudinary_url
        elif self.download_link:
            return self.download_link
        return None
    
    def get_file_size_formatted(self):
        """Get human readable file size"""
        if not self.file_size:
            return "Unknown"
        
        if self.file_size < 1024:
            return f"{self.file_size} B"
        elif self.file_size < 1024**2:
            return f"{self.file_size/1024:.1f} KB"
        elif self.file_size < 1024**3:
            return f"{self.file_size/(1024**2):.1f} MB"
        else:
            return f"{self.file_size/(1024**3):.1f} GB"
    
    def __repr__(self):
        return f'<Paper {self.title}>'

class Bookmark(db.Model):
    __tablename__ = 'bookmarks'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    paper_id = db.Column(db.Integer, db.ForeignKey('papers.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    __table_args__ = (db.UniqueConstraint('user_id', 'paper_id', name='unique_user_paper_bookmark'),)
    
    def __repr__(self):
        return f'<Bookmark User:{self.user_id} Paper:{self.paper_id}>'

class Subject(db.Model):
    __tablename__ = 'subjects'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    code = db.Column(db.String(20))
    department = db.Column(db.String(100))
    credits = db.Column(db.Integer)
    is_active = db.Column(db.Boolean, default=True)
    
    def __repr__(self):
        return f'<Subject {self.name}>'

class Feedback(db.Model):
    __tablename__ = 'feedback'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    subject = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(20), default='pending')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<Feedback {self.subject}>'

class UploadLog(db.Model):
    __tablename__ = 'upload_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    paper_id = db.Column(db.Integer, db.ForeignKey('papers.id'))
    cloudinary_public_id = db.Column(db.String(500))
    action = db.Column(db.String(50))  # upload, delete, approve, reject
    status = db.Column(db.String(50))  # success, failed, pending
    error_message = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    user = db.relationship('User', backref='upload_logs')
    paper = db.relationship('Paper', backref='upload_logs')
    
    def __repr__(self):
        return f'<UploadLog {self.action} {self.status}>'