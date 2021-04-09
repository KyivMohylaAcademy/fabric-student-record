'use strict';

const { Contract } = require('fabric-contract-api');
const { ClientIdentity } = require('fabric-shim');

class StudentRecordsStorage extends Contract {
  constructor() {
    super('org.fabric.studentRecordsStorage');
  }

  async createStudent(ctx, fullName) {
    const student = new ClientIdentity(ctx.stub);
    if(indemtity.cert.subject.organizationalUnitName !== 'admin') {
      throw new Error('Access denied');
    }
    const recordAsBytes = await ctx.stub.getState(studentEmail);
    if(recordAsBytes && recordAsBytes.toString().length) {
      throw new Error('Student with this email already exists');
    }
    const newRecord = Buffer.from(JSON.stringify({
      fullName,
      semesters: []
    }));
    await ctx.stub.putState(studentEmail, newRecord);
    return JSON.stringify(student.cert.subject, null, 2)
  }

  async getStudent(ctx, studentEmail) {
    const identity = new ClientIdentity(ctx.stub);
    if (identity.cert.subject.organizationalUnitName !== 'admin') {
      throw new Error("Access denied");
    }
    const recordAsBytes = await ctx.stub.getState(studentEmail);
    if (!recordAsBytes || !recordAsBytes.toString().length) {
      throw new Error("No such student exists");
    }
    return JSON.parse(recordAsBytes.toString());
  }

  async addStudentsSubject(ctx, studentEmail, semesterNumber, subjectName ) {
    const record = await this.getStudent(ctx, studentEmail);
    if (!record.semesters[semesterNumber])
      record.semesters[semesterNumber] = {};
    record.semesters[semesterNumber][subjectName] = {
      lector: identity.cert.subject.commonName,
      themes: []
    }

    const newRecordsOfSubs = Buffer.from(JSON.stringify(record));
    await ctx.stub.putState(studentEmail, newRecordsOfSubs);
    return JSON.stringify(record, null, 2);
  }

  async addStudentsGrade(ctx, studentEmail, semester, subjectName, title, grade) {
    const record = await this.getStudent(ctx, studentEmail);
    const topic = {
      title,
      grade,
      date: Date.now(),
    };
    if (!record.semesters[semester]?.[subjectName]) {
      throw new Error("Wrong semester for this subject");
    }
    record.semesters[semester][subjectName].themes.push(topic);
    const newRecordsOfGrades = Buffer.from(JSON.stringify(record));
    await ctx.stub.putState(studentEmail, newRecordsOfGrades);
    return JSON.stringify(record, null, 2);
  }

  async getStudentsGragesAll(ctx, studentEmail) {
    const record = await this.getStudent(ctx, studentEmail);
    return JSON.stringify(record.semesters, null, 2);
  }

  async getStudentGragesTrim(ctx, studentEmail, semester) {
    const record = await getStudentRecord(ctx, studentEmail);
    return JSON.stringify(record.semesters[semester] || [], null, 2);
  }
}

module.exports = StudentRecordsStorage;