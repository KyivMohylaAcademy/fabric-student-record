'use strict';

const { Contract } = require('fabric-contract-api');
const { ClientIdentity } = require('fabric-shim');

class StudentRecordsStorage extends Contract {
  constructor() {
    super('org.fabric.studentRecordsStorage');
  }

  async createStudentRecord(ctx, studentEmail, fullName) {
    const identity = new ClientIdentity(ctx.stub);
    if (identity.cert.subject.organizationalUnitName !== 'teacher') {
      throw new Error('No access');
    }
    const recordExample = {
      fullName: fullName,
      semesters: {}
    }
    const newRecordInBytes = Buffer.from(JSON.stringify(recordExample));
    await ctx.stub.putState(studentEmail, newRecordInBytes);
    return JSON.stringify(recordExample, null, 2);
  }

  async addSubjectToStudentRecord(ctx, studentEmail, semesterNumber, subjectName) {
    const identity = new ClientIdentity(ctx.stub);
    if (identity.cert.subject.organizationalUnitName !== 'teacher') {
      throw new Error('No access');
    }
    const recordAsBytes = await ctx.stub.getState(studentEmail);
    const recordAsObject = JSON.parse(recordAsBytes.toString());
    if (!recordAsObject.semesters[semesterNumber])
      recordAsObject.semesters[semesterNumber] = {};

    recordAsObject.semesters[semesterNumber][subjectName] = {
      lector: identity.cert.subject.commonName,
      themes: []
    }
  
    const newRecordInBytes = Buffer.from(JSON.stringify(recordAsObject));
    await ctx.stub.putState(studentEmail, newRecordInBytes);
    return JSON.stringify(recordAsObject, null, 2);
  }

  async addMark(ctx, studentEmail, semesterNumber, subjectName, theme, grade) {
    const identity = new ClientIdentity(ctx.stub);
    if (identity.cert.subject.organizationalUnitName !== 'teacher') {
      throw new Error('No access');
    }

    const record = JSON.parse((await ctx.stub.getState(studentEmail)).toString());
    
    if (!record.semesters[semesterNumber] || !record.semesters[semesterNumber][subjectName]) {
      throw new Error('No such subject in this semester');
    }

    record.semesters[semesterNumber][subjectName].themes.push({
      name: theme,
      teacher: identity.cert.subject.commonName,
      rating: grade
    });
  
    await ctx.stub.putState(studentEmail, Buffer.from(JSON.stringify(record)));
    return JSON.stringify(record, null, 2);
  }

  async getStudentData(ctx, studentEmail) {
    return (await ctx.stub.getState(studentEmail)).toString();
  }
}

module.exports = StudentRecordsStorage;
