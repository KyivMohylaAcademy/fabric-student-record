'use strict';

const { Contract } = require('fabric-contract-api');
const { ClientIdentity } = require('fabric-shim');

class StudentRecordsStorage extends Contract {
  constructor() {
    super('org.fabric.studentRecordsStorage');
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

    const recordExample = {
      fullName: fullName,
      semesters: []
    }

    const newRecordInBytes = Buffer.from(JSON.stringify(recordExample));
    await ctx.stub.putState(studentEmail, newRecordInBytes);
    return JSON.stringify(recordExample, null, 2);
  }

  async addSubjectToStudentRecord(ctx, studentEmail, semestrNumber, subjectName){
    const identity = new ClientIdentity(ctx.stub);
    if(identity.cert.subject.organizationalUnitName !== 'admin'){
      throw new Error('Current subject haven`t access to this function');
    }

    const recordAsBytes = await ctx.stub.getState(studentEmail);
    if (!recordAsBytes || recordAsBytes.toString().length === 0) {
      throw new Error("Student with this email doesn`t exist");
    }
    const recordAsObject = JSON.parse(recordAsBytes.toString());
    
    recordAsObject.semesters[semestrNumber][subjectName] = {
      lector: identity.cert.subject.commonName,
      themes: []
    };

    const newRecordInBytes = Buffer.from(JSON.stringify(recordAsObject));
    await ctx.stub.putState(studentEmail, newRecordInBytes);
    return JSON.stringify(recordAsObject, null, 2);
  }

  async addGradeToStudentRecord(ctx, studentEmail, semestrNumber, subjectName, topic, grade) {
    const identity = new ClientIdentity(ctx.stub);
    if(identity.cert.subject.organizationalUnitName !== 'admin'){
      throw new Error('Current subject haven`t access to this function');
    }

    const recordAsBytes = await ctx.stub.getState(studentEmail);
    if (!recordAsBytes || recordAsBytes.toString().length === 0) {
      throw new Error("Student with this email doesn`t exist");
    }
    const recordAsObject = JSON.parse(recordAsBytes.toString());

    if (!recordAsObject.semesters[semestrNumber]?.[subjectName]) {
      throw new Error("Subject or semester doesn`t exist!");
    }

    const theme = {
      title: topic,
      grade: grade,
      date: Date.now(),
    };

    recordAsObject.semesters[semester][subjectName].themes.push(theme);

    const newRecordInBytes = Buffer.from(JSON.stringify(recordAsObject));
    await ctx.stub.putState(studentEmail, newRecordInBytes);

    return JSON.stringify(recordAsObject, null, 2);
  }


  async getStudentRecord(ctx, studentEmail) {
    const recordAsBytes = await ctx.stub.getState(studentEmail);
    if (!recordAsBytes || recordAsBytes.toString().length === 0) {
      throw new Error("Student with this email doesn`t exist");
    }

    const recordAsObject = JSON.parse(recordAsBytes.toString())
    return JSON.stringify(recordAsObject.semesters,null,2);
  }

  async getStudentSemestrRecord(ctx, studentEmail, semestrNumber) {
    const recordAsBytes = await ctx.stub.getState(studentEmail);
    if (!recordAsBytes || recordAsBytes.toString().length === 0) {
      throw new Error("Student with this email doesn`t exist");
    }

    return JSON.stringify(recordAsObject.semesters[semestrNumber] || [], null, 2);
  }
}

module.exports = StudentRecordsStorage;
