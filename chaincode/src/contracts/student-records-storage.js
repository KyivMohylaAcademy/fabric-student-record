const { Contract } = require('fabric-contract-api');
const { ClientIdentity } = require('fabric-shim');

class StudentRecordsStorage extends Contract {
  constructor() {
    super('org.fabric.studentRecordsStorage');
  }

  async updateStudentRecord(ctx, email, record) {
    const recordBytes = Buffer.from(JSON.stringify(record));
    await ctx.stub.putState(email, recordBytes);
  }
  async getStudentRecord(ctx, email) {
    const identity = new ClientIdentity(ctx.stub);
    if (identity.cert.subject.organizationalUnitName !== 'admin') {
      throw new Error("Access denied");
    }
    const bytes = await ctx.stub.getState(email);
    const record = bytes && bytes.toString();
    if (!record || !record.length) {
      throw new Error("Not found");
    }
    return JSON.parse(record);
  }
  async getStudentGrades(ctx, email) {
    const record = await this.getStudentRecord(ctx, email);
    return JSON.stringify(record.semesters, null, 2);
  }
  async getStudentGradesBySem(ctx, email, sem) {
    const grades = await this.getStudentGrades(ctx, email);

    return JSON.stringify(JSON.parse(grades)[sem], null, 2);
  }
  async setGradeForStudent(ctx, sem, subject, theme, email, grade) {
    const record = await this.getStudentRecord(ctx, email);
    const currentSemester = record.semesters[sem];
    if(!currentSemester){
      throw Error("Semester not found")
    }
    const currentSubject = currentSemester[subject];
    if(!currentSubject){
      throw new Error("Subject not found")
    }

    currentSubject.themes.push([{ theme, grade }]);

    await this.updateStudentRecord(ctx, email, record);
    return JSON.stringify(record, null, 2);
  }
}

module.exports = StudentRecordsStorage; 
