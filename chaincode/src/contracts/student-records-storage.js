'use strict';

const { Contract } = require('fabric-contract-api');
const { ClientIdentity } = require('fabric-shim');

class StudentRecordsStorage extends Contract {
  constructor() {
    super('org.fabric.studentRecordsStorage');
  }

  async createStudentRecord(ctx, studentEmail, fullName){
    const identity = new ClientIdentity(ctx.stub);

    if(identity.cert.subject.organizationalUnitName !== 'teacher'){
      throw new Error('Current subject is not have access to this function');
    }

    const recordAsBytes = await ctx.stub.getState(studentEmail);

    if(!recordAsBytes || recordAsBytes.toString().length !== 0){
      throw new Error('Student with current email already exist');
    }

    const recordExample = {
      fullName: fullName,
      semesters: []
    }

    const newRecordInBytes = Buffer.from(JSON.stringify(recordExample));

    await ctx.stub.putState(studentEmail, newRecordInBytes);
    return JSON.stringify(recordExample, null, 2);
  }

  async addSubjectToStudentRecord(ctx, studentEmail, semesterNumber, subjectName){
    const identity = new ClientIdentity(ctx.stub);

    if(identity.cert.subject.organizationalUnitName !== 'admin'){
      throw new Error('Current subject is not have access to this function');
    }

    const recordAsBytes = await ctx.stub.getState(studentEmail);

    const recordAsObject = JSON.parse(recordAsBytes.toString());

    recordAsObject.semesters[semesterNumber][subjectName] = {
      lector: identity.cert.subject.commonName,
      themes: []
    }

    const newRecordInBytes = Buffer.from(JSON.stringify(recordAsObject));

    await ctx.stub.putState(studentEmail, newRecordInBytes);
    return JSON.stringify(recordAsObject, null, 2);
  }

  async getStudentRecord(ctx, studentEmail){
    const identity = new ClientIdentity(ctx.stub);

    if(identity.cert.subject.organizationalUnitName !== 'admin'){
      throw new Error('Current subject is not have access to this function');
    }

    const recordAsBytes = await ctx.stub.getState(studentEmail);

    if(!recordAsBytes || recordAsBytes.toString().length !== 0){
      throw new Error('Student with current email already exist');
    }

    return JSON.parse(recordAsBytes.toString());
  }

  async updateStudentRecord(ctx, studentEmail, entity){
    const newRecordInBytes = Buffer.from(JSON.stringify(entity));
    await ctx.stub.putState(studentEmail, newRecordInBytes);
  }

  async addGradeToStudentRecord(ctx, studentEmail, semesterNumber, subjectName, subjectTitle, subjectGrade){
    const record = await this.getStudentRecord(ctx, studentEmail);

    if(!record.semesters[semesterNumber]?.[subjectName]){
      throw new Error('Subject in this semester don`t exist');
    }

    record.semesters[semesterNumber][subjectName].themes.push(
      [
        {
          subjectTitle,
          subjectGrade
        }
      ]
    );

    await this.updateStudentRecord(ctx, studentEmail, record);

    return JSON.stringify(record, null, 2);
  }

  async getStudentGrades(ctx, studentEmail){
    const record = await this.getStudentRecord(ctx, studentEmail);
    return JSON.stringify(record.semesters, null, 2);
  }

  async getStudentGradesBySemester(ctx, studentEmail, semesterNumber){
    const record = await this.getStudentRecord(ctx, studentEmail);
    return JSON.stringify(record.semesters[semesterNumber], null, 2);
  }
  
}

module.exports = StudentRecordsStorage;
