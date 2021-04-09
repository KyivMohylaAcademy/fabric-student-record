'use strict';

const { Contract } = require('fabric-contract-api');
const { ClientIdentity } = require('fabric-shim');

class StudentRecordsStorage extends Contract {
  constructor() {
    super('org.fabric.studentRecordsStorage');
  }

  verifyIdentity(ctx) {
    const identity = new ClientIdentity(ctx.stub);
    if(identity.cert.subject.organizationalUnitName !== 'admin'){
      throw new Error('Current subject is not have access to this function');
    }
  }

  async createStudentRecord(ctx, studentEmail, fullName) {
    this.verifyIdentity(ctx);

    const recordAsBytes = await ctx.stub.getState(studentEmail);
    if(recordAsBytes || recordAsBytes.toString().length !== 0){
      throw new Error('Student with the current email already exist');
    }
    const newStudentRecord = {
      fullName: fullName,
      semesters: []
    }
    const newRecordInBytes = Buffer.from(JSON.stringify(newStudentRecord));
    await ctx.stub.putState(studentEmail, newRecordInBytes);
    return JSON.stringify(newStudentRecord, null, 2);
  }

  async getStudentRecord(ctx, studentEmail){
    const recordAsBytes = await ctx.stub.getState(studentEmail);
    if(!recordAsBytes || recordAsBytes.toString().length === 0){
      throw new Error('Student with current email does not exist');
    }
    return JSON.parse(recordAsBytes.toString());
  }

  async addSubjectToStudentRecord(ctx, studentEmail, semesterNumber, subjectName) {
    this.verifyIdentity(ctx);

    const recordAsObject = this.getStudentRecord(ctx, studentEmail);
    if(!recordAsObject.semesters[semesterNumber]) {
      recordAsObject.semesters[semesterNumber] = {}
    }
    if(recordAsObject.semesters[semesterNumber][subjectName]) {
      throw new Error('Subject already exists!')
    }
    recordAsObject.semesters[semesterNumber][subjectName] = {
      lector: identity.cert.subject.commonName,
      themes: []
    }
    const newRecordInBytes = Buffer.from(JSON.stringify(recordAsObject));
    await ctx.stub.putState(studentEmail, newRecordInBytes);
    return JSON.stringify(recordAsObject, null, 2);
  }

  async addGradeToStudentRecord(ctx, studentEmail, semesterNumber, subjectName, themeName, grade){
    this.verifyIdentity(ctx);

    const recordAsObject = this.getStudentRecord(ctx, studentEmail);
    if(!recordAsObject.semesters[semesterNumber]){
      throw new Error('Semester not found')
    }
    if(!recordAsObject.semesters[semesterNumber][subjectName]){
      throw new Error(`Subject does not exist in ${semesterNumber} semester for this student`)
    }
    recordAsObject.semesters[semesterNumber][subjectName].themes.push([
      {
        title: themeName,
        rating: grade,
        date: ctx.stub.getTxTimestamp().seconds.low
      }
    ]);
  }

  async getStudentGrades(ctx, studentEmail) {
    const recordAsObject = await this.getStudentRecord(ctx, studentEmail);
    return JSON.stringify(recordAsObject.semesters, null, 2);
  }

  async getStudentGradesBySemester(ctx, studentEmail, semesterNumber) {
    const recordAsObject = await this.getStudentRecord(ctx, studentEmail);
    return JSON.stringify(recordAsObject.semesters[semesterNumber] || [], null, 2);
  }

}

module.exports = StudentRecordsStorage;
