'use strict';

const { Contract } = require('fabric-contract-api');
const { ClientIdentity } = require('fabric-shim');

class StudentRecordsStorage extends Contract {
  constructor() {
    super('org.fabric.studentRecordsStorage');
  }

  async getStudentRecord(ctx, studentEmail) {
    const identity = new ClientIdentity(ctx.stub);
    if (identity.cert.subject.organizationalUnitName !== 'admin') {
      throw new Error("Current user does not have access to this function!");
    }

    const recordAsBytes = await ctx.stub.getState(studentEmail);
    if (!recordAsBytes || recordAsBytes.toString().length === 0) {
      throw new Error("Student with this email does not exist!");
    }
    return JSON.parse(recordAsBytes.toString());
  }

  async updateStudentRecord(ctx, studentEmail, record) {
    const newRecordInBytes = Buffer.from(JSON.stringify(record));
    await ctx.stub.putState(studentEmail, newRecordInBytes);
  }

  async createStudentRecord(ctx, studentEmail, fullName) {
    const identity = new ClientIdentity(ctx.stub);
    if (identity.cert.subject.organizationalUnitName !== 'admin') {
      throw new Error("Current user does not have access to this function.");
    }

    const recordAsBytes = await ctx.stub.getState(studentEmail);
    if (recordAsBytes && recordAsBytes.toString().length !== 0) {
      throw new Error("Student with this email already exists!");
    }

    const record = {
      fullName: fullName,
      semesters: []
    }

    const newRecordInBytes = Buffer.from(JSON.stringify(record));
    await ctx.stub.putState(studentEmail, newRecordInBytes);
    return JSON.stringify(record, null, 2);
  }


  async addSubjectToStudentRecord(ctx, studentEmail, semesterNumber, subjectName) {
    const record = await getStudentRecord(ctx, studentEmail);
    const teacherEmail = identity.cert.subject.commonName;
    
    if (!record.semesters[semesterNumber]) {
      record.semesters[semesterNumber] = {};
    }

    record.semesters[semesterNumber][subjectName] = {
      lector: teacherEmail,
      themes: []
    }

    await updateStudentRecord(ctx, studentEmail, record);
    return JSON.stringify(record, null, 2);
  }

  async addGradeToStudentRecord(ctx, studentEmail, semester, subjectName, theme, grade) {
    const record = await getStudentRecord(ctx, studentEmail);
    if (!record.semesters[semester]?.[subjectName]) {
      throw new Error("This subject in this semester does not exist!");
    }

    record.semesters[semester][subjectName].themes.push([
      {
        title: theme,
        rating: grade,
        date: Date.now()
      }
    ]);

    await updateStudentRecord(ctx, studentEmail, record);
    return JSON.stringify(record, null, 2);
  }

  async getAllStudentGrages(ctx, studentEmail) {
    const record = await getStudentRecord(ctx, studentEmail);

    return JSON.stringify(record.semesters, null, 2);
  }

  async getStudentGragesBySemester(ctx, studentEmail, semester) {
    const record = await getStudentRecord(ctx, studentEmail);

    return JSON.stringify(record.semesters[semester] || [], null, 2);
  }
}

module.exports = StudentRecordsStorage;