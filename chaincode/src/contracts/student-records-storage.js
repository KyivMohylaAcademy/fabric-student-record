'use strict';

const { Contract } = require('fabric-contract-api');
const { ClientIdentity } = require('fabric-shim');

class StudentRecordsStorage extends Contract {
  constructor() {
    super('org.fabric.studentRecordsStorage');
  }

  async createStudent(ctx, fullName) {
    const identity = new ClientIdentity(ctx.stub);

    if(indemtity.cert.subject.organizationalUnitName !== 'admin') {
      throw new Error('Current subject does not have access to this function');
    }

    const recordAsBytes = await ctx.stub.getState(studentEmail);

    if(recordAsBytes && recordAsBytes.toString().length) {
      throw new Error('Student with curreny email already exists');
    }

    const recordExample = {
      fullName,
      semesters: []
    };

    const newRecordInBytes = Buffer.from(JSON.stringify(recordExample));
    await ctx.stub.putState(studentEmail, newRecordInBytes);
    return JSON.stringify(identity.cert.subject, null, 2)
  }

  async getStudent(ctx, studentEmail) {
    const identity = new ClientIdentity(ctx.stub);
    
    if (identity.cert.subject.organizationalUnitName !== 'admin') {
      throw new Error("Current user does not have access to this function!");
    }

    const recordAsBytes = await ctx.stub.getState(studentEmail);

    if (!recordAsBytes || !recordAsBytes.toString().length) {
      throw new Error("Student with this email does not exist!");
    }

    return JSON.parse(recordAsBytes.toString());
  }

  async addSubjectToStudent(ctx, studentEmail, semesterNumber, subjectName ) {
    const record = await this.getStudent(ctx, studentEmail);

    if (!record.semesters[semesterNumber])
      record.semesters[semesterNumber] = {};

    record.semesters[semesterNumber][subjectName] = {
      lector: identity.cert.subject.commonName,
      themes: []
    }

    const newRecordInBytes = Buffer.from(JSON.stringify(record));
    await ctx.stub.putState(studentEmail, newRecordInBytes);

    return JSON.stringify(record, null, 2);
  }

  async getStudentGrages(ctx, studentEmail) {
    const record = await this.getStudent(ctx, studentEmail);
    return JSON.stringify(record.semesters, null, 2);
  }

  async getStudentGragesBySem(ctx, studentEmail, semester) {
    const record = await this.getStudent(ctx, studentEmail);
    const grades = record.semesters[semester] || [];
    return JSON.stringify(grades, null, 2);
  }

  async addGradeToStudent(ctx, studentEmail, semester, subjectName, title, grade) {
    const record = await this.getStudent(ctx, studentEmail);

    if (!record.semesters[semester]?.[subjectName]) {
      throw new Error("This subject in this semester does not exist!");
    }

    const theme = {
      title,
      grade,
      date: Date.now(),
    };

    record.semesters[semester][subjectName].themes.push(theme);

    const newRecordInBytes = Buffer.from(JSON.stringify(record));
    await ctx.stub.putState(studentEmail, newRecordInBytes);

    return JSON.stringify(record, null, 2);
  }
}

module.exports = StudentRecordsStorage;
