import fs from 'fs';
import path from 'path';

const DB_DIR = path.join(__dirname, '../../data');
const DB_FILE = path.join(DB_DIR, 'db.json');

export interface AttachedDoctor {
  name: string;
  phone: string;
  designation: string;
  department: string;
  opdTimings: string;
  fee: string;
}

export interface HospitalProfile {
  // Step 1: Institution Details
  institutionName?: string;
  legalStatus?: string;
  establishmentYears?: string;
  licenseNumber?: string;
  gstNumber?: string;
  servicesOffered?: string[];

  // Step 2: Location and Contact
  facilityHeadName?: string;
  institutionEmail?: string;
  address?: string;
  phone?: string;

  // Step 3: Attached Doctors
  attachedDoctors?: AttachedDoctor[];

  // Step 4: Insurance Companies
  supportedInsurances?: string[];
}

export interface DoctorProfile {
  title?: string;
  dob?: string;
  gender?: string;
  nationality?: string;
  languages?: string[];
  whatsappNumber?: string;
  address?: string;
  district?: string;
  cityState?: string;
  pinCode?: string;
  
  // Professional Details
  degrees?: { degree: string; college: string; university: string; year: string; specialization?: string }[];
  registrationNumber?: string;
  medicalCouncil?: string;
  dateOfRegistration?: string;
  experienceYears?: string;
  specialization?: string;
  country?: string;

  // Clinic Details
  clinicName?: string;
  clinicAddress?: string;
  consultationFee?: string;
  opdTimings?: { [day: string]: { active: boolean; start: string; end: string } };
  coordinates?: { lat: number; lng: number };
}

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  role: 'Admin' | 'Doctor' | 'Nurse' | 'Pharmacist' | 'Lab Technician';
  phone?: string;
  hospitalName?: string;
  profileCompleted?: boolean; // True when onboarding setup is finished
  doctorProfile?: DoctorProfile; // Doctor setup wizard dataset
  hospitalProfile?: HospitalProfile; // Hospital setup wizard dataset
  createdAt: string;
}

class Database {
  private data: { users: User[] } = { users: [] };

  constructor() {
    this.init();
  }

  private init() {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      try {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(fileContent);
      } catch (err) {
        console.error('Error reading database file, resetting...', err);
        this.save();
      }
    } else {
      this.save();
    }
  }

  public save() {
    fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
  }

  public getUsers(): User[] {
    return this.data.users;
  }

  public getUserByEmail(email: string): User | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public getUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  public addUser(user: User): void {
    this.data.users.push(user);
    this.save();
  }

  public updateUser(id: string, updates: Partial<User>): User | undefined {
    const userIndex = this.data.users.findIndex(u => u.id === id);
    if (userIndex === -1) return undefined;
    
    this.data.users[userIndex] = {
      ...this.data.users[userIndex],
      ...updates
    };
    this.save();
    return this.data.users[userIndex];
  }
}

export const db = new Database();
