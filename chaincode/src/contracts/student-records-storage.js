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
      throw new Error('Current subject is not have access to this function');
    }
    const recordAsBytes = await ctx.stub.getState(studentEmail);
    // if(!recordAsBytes || recordAsBytes.toString().length !== 0){
    //   throw new Error('Student with the current email already exist');
    // }
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
      throw new Error('Current subject is not have access to this function');
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

  async putMark(ctx, studentEmail, semesterNumber, subjectName, theme, grade) {
    const identity = new ClientIdentity(ctx.stub);
    if (identity.cert.subject.organizationalUnitName !== 'teacher') {
      throw new Error('Current subject is not have access to this function');
    }
    const recordAsBytes = await ctx.stub.getState(studentEmail);
    const record = JSON.parse(recordAsBytes.toString());
    if (!record.semesters[semesterNumber] || !record.semesters[semesterNumber][subjectName]) {
      throw new Error('Cannot find subject in this semester');
    }

    record.semesters[semesterNumber][subjectName].themes.push({
      name: theme,
      teacher: identity.cert.subject.commonName,
      rating: grade
    });
  
    const newRecordInBytes = Buffer.from(JSON.stringify(record));
    await ctx.stub.putState(studentEmail, newRecordInBytes);
    return JSON.stringify(record, null, 2);
  }

  async getStudentData(ctx, studentEmail) {
    const recordAsBytes = await ctx.stub.getState(studentEmail);
    const recordAsString = recordAsBytes.toString();
    return recordAsString;
  }
}

module.exports = StudentRecordsStorage;
