'use strict';

const { Contract } = require('fabric-contract-api');
const { ClientIdentity } = require('fabric-shim');

class StudentRecordsStorage extends Contract {
  constructor() {
    super('org.fabric.studentRecordsStorage');
  }

  async getStudent(ctx, identity, studentEmail) {
    if (identity.cert.subject.organizationalUnitName !== 'teacher') {
      throw new Error('Current subject is not have access to this function');
    }
    const recordAsBytes = await ctx.stub.getState(studentEmail);
    return JSON.parse(recordAsBytes.toString());
  }

  async createStudentRecord(ctx, studentEmail, fullName) {
    const identity = new ClientIdentity(ctx.stub);
    if (identity.cert.subject.organizationalUnitName !== 'teacher') {
      throw new Error('Current subject is not have access to this function');
    }
    const recordAsBytes = await ctx.stub.getState(studentEmail);
     if(!recordAsBytes || recordAsBytes.toString().length !== 0){
       throw new Error('Student with the current email already exist');
    }
    const recordExample = {
      fullName: fullName,
      semesters: []
    }
    const newRecordInBytes = Buffer.from(JSON.stringify(recordExample));
    await ctx.stub.putState(studentEmail, newRecordInBytes);
    return JSON.stringify(recordExample, null, 2);
  }

  async addSubjectToStudentRecord(ctx, studentEmail, semesterNumber, subjectName) {
    const identity = new ClientIdentity(ctx.stub);
    const recordAsObject = await this.getStudent(ctx, identity, studentEmail);

    recordAsObject.semesters[semesterNumber][subjectName] = {
      lecturer: identity.cert.subject.commonName,
      topics: [] // initialize with empty array
    }
    const newRecordInBytes = Buffer.from(JSON.stringify(recordAsObject));
    await ctx.stub.putState(studentEmail, newRecordInBytes);
    return JSON.stringify(recordAsObject, null, 2);
  }

  // this function combines adding a topic to a subject AND grading it right away
  async gradeTopic(ctx, studentEmail, semesterNumber, subjectName, topic, grade) {
    const identity = new ClientIdentity(ctx.stub);
    const recordAsObject = this.getStudent(ctx, identity, studentEmail);

    const isAlreadyAdded = recordAsObject.semesters[semesterNumber][subjectName].find((t) => t.topic === topic);
    if(isAlreadyAdded) {
      throw new Error(`Topic ${topic} for subject ${subjectName} and student ${studentEmail} already exists.`)
    }
    recordAsObject.semesters[semesterNumber][subjectName].topics.push({
      topic: topic,
      grade: grade
    });
    const newRecordInBytes = Buffer.from(JSON.stringify(recordAsObject));
    await ctx.stub.putState(studentEmail, newRecordInBytes);
    return JSON.stringify(recordAsObject, null, 2);
  }

  async getStudentGrades(ctx, studentEmail) {
    const identity = new ClientIdentity(ctx.stub);
    const recordAsObject = this.getStudent(ctx, identity, studentEmail);
    const allStudentGrades = recordAsObject.semesters.flatMap((semester) =>
        semester.flatMap((subj) => subj.topics.map((t) => t.grade)));

    return Array.from(allStudentGrades).toString();
  }

  async getStudentGradesWithSemester(ctx, studentEmail, semesterNumber) {
    const identity = new ClientIdentity(ctx.stub);
    const recordAsObject = this.getStudent(ctx, identity, studentEmail);
    const allStudentGrades = recordAsObject.semesters[semesterNumber].flatMap((subj) =>
        subj.topics.map((t) =>
            t.grade));

    return Array.from(allStudentGrades).toString();
  }
}


module.exports = StudentRecordsStorage;
