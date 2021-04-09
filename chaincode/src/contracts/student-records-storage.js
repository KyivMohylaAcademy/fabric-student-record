'use strict';

const { Contract } = require('fabric-contract-api');
const { ClientIdentity } = require('fabric-shim');

class StudentRecordsStorage extends Contract {
  constructor() {
    super('org.fabric.studentRecordsStorage');
  }

  async createSubjectToRecord(ctx,studentEmail, fullName) {
    const identity = new ClientIdentity(ctx.stub);
    if (identity.cert.subject.organizationalUnitName !== 'admin'){
      throw new Error('Current subject has no access to this function')
    }
    const recordAsBytes = await ctx.stub.getState(studentEmail);

    if (!!recordAsBytes && recordAsBytes.length !== 0){
      throw new Error("This student already exists")
    }
    const newRecord = {
      fullName,
      semesters : [],
    }
    await ctx.stub.putState(studentEmail,Buffer.from(JSON.stringify(newRecord)))
    return JSON.stringify(newRecord,null,2);
  }

  async addSubjectToStudentRecord(ctx,studentEmail, semesterNumber,subjectName) {
    const identity = new ClientIdentity(ctx.stub);
    if (identity.cert.subject.organizationalUnitName !== 'admin'){
      throw new Error('Current subject has no access to this function')
    }
    const recordAsBytes = await ctx.stub.getState(studentEmail);

    if (recordAsBytes.length === 0){
      throw new Error("This student does not exist")
    }
    const recordAsObject = JSON.parse(recordAsBytes.toString());
    if (recordAsObject.semesters[semesterNumber]){
      if (recordAsObject.semesters[semesterNumber][subjectName]){
        throw new Error("This student already has this subject")
      }
      else
      recordAsObject.semesters[semesterNumber][subjectName] = {
        lector: identity.cert.subject.commonName,
        themes: []
      }
    } else
      recordAsObject.semesters[semesterNumber] = {
        [subjectName]: {
          lector: identity.cert.subject.commonName,
          themes: []
        }
      }


    await ctx.stub.putState(studentEmail,Buffer.from(JSON.stringify(recordAsObject)))
    return JSON.stringify(recordAsObject,null,2);
  }
  async addGradeToStudentRecord(ctx,studentEmail, semesterNumber,subjectName,themeName,grade) {
    const identity = new ClientIdentity(ctx.stub);
    if (identity.cert.subject.organizationalUnitName !== 'admin'){
      throw new Error('Current subject has no access to this function')
    }
    const recordAsBytes = await ctx.stub.getState(studentEmail);

    if (recordAsBytes.length === 0){
      throw new Error("This student does not exist")
    }
    const recordAsObject = JSON.parse(recordAsBytes.toString());

    if (recordAsObject.semesters[semesterNumber]){
      if (recordAsObject.semesters[semesterNumber][subjectName]){
        recordAsObject.semesters[semesterNumber][subjectName]["themes"].push({
          title: themeName,
          rating: grade,
          date: ctx.stub.getTxTimestamp().seconds.low
        })
      }
      else{
        throw new Error("This student doesn't enrolled in this subject")
      }
    }
    else{
      throw new Error("This subject does not exist in this semester")
    }


    await ctx.stub.putState(studentEmail,Buffer.from(JSON.stringify(recordAsObject)))

    return JSON.stringify(recordAsObject,null,2);
  }
  async getStudentRecords(ctx,studentEmail) {
    const recordAsBytes = await ctx.stub.getState(studentEmail);

    if (recordAsBytes.length === 0){
      throw new Error("This student does not exist")
    }
    const recordAsObject = JSON.parse(recordAsBytes.toString())
    return JSON.stringify(recordAsObject.semesters,null,2);
  }
  async getStudentRecordsBySemester(ctx,studentEmail,semesterNumber) {
    const recordAsBytes = await ctx.stub.getState(studentEmail);

    if (recordAsBytes.length === 0){
      throw new Error("This student does not exist")
    }
    const recordAsObject = JSON.parse(recordAsBytes.toString())
    return JSON.stringify(recordAsObject.semesters[semesterNumber] || [],null,2);
  }

}

module.exports = StudentRecordsStorage;
