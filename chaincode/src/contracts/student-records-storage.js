'use strict';

const {Contract} = require('fabric-contract-api');
const {ClientIdentity} = require('fabric-shim');

class StudentRecordsStorage extends Contract {
    constructor() {
        super('org.fabric.studentRecordsStorage');
    }

    async createStudentRecord(ctx, studentEmail, fullName) {

        const identity = new ClientIdentity(ctx.stub);

        if (identity.cert.subject.organizationalUnitName !== 'admin')
            throw new
            Error("Current user does not have access to this function.");

        const recordAsBytes = await ctx.stub.getState(studentEmail);

        if (Boolean(recordAsBytes) && recordAsBytes.toString().length !== 0)
            throw new
            Error("Student with this email already exists!");

        const studentRecord = {
            fullName,
            semesters: []
        }

        await ctx.stub.putState(studentEmail, Buffer.from(JSON.stringify(record)));

        return JSON.stringify(studentRecord, null, 2);
    }

    async getStudentRecord(ctx, studentEmail) {
        const identity = new ClientIdentity(ctx.stub);

        if (identity.cert.subject.organizationalUnitName !== 'admin')
            throw new
            Error("Current user does not have access to this function!");

        const recordAsBytes = await ctx.stub.getState(studentEmail);

        if (!recordAsBytes || recordAsBytes.toString().length === 0)
            throw new
            Error("Student with this email does not exist!");

        return JSON.parse(recordAsBytes.toString());
    }

    updateStudentRecord = async (ctx, studentEmail, record) =>
        await ctx.stub.putState(studentEmail, Buffer.from(JSON.stringify(record)));

    async addStudentSubject(ctx, studentEmail, semester, subjectName) {
        const teacherEmail = identity.cert.subject.commonName;

        const record = await this.getStudentRecord(ctx, studentEmail);

        if (!record.semesters[semester])
            record.semesters[semester] = {};

        record.semesters[semester][subjectName] =
            {
                lector: teacherEmail,
                themes: []
            }

        await this.updateStudentRecord(ctx, studentEmail, record);

        return JSON.stringify(record, null, 2);
    }

    async getAllStudentGrades(ctx, studentEmail) {
        const record = await this.getStudentRecord(ctx, studentEmail);

        return JSON.stringify(record.semesters, null, 2);
    }

    async getStudentGradesBySemester(ctx, studentEmail, semester) {
        const record = await this.getStudentRecord(ctx, studentEmail);

        return JSON.stringify([] || record.semesters[semester], null, 2);
    }

    async addStudentGrade(ctx, studentEmail, semester, subjectName, theme, grade) {
        const record = await this.getStudentRecord(ctx, studentEmail);

        if (!record.semesters[semester]?.[subjectName])
            throw new
            Error("This subject in this semester does not exist!");

        record.semesters[semester][subjectName]
            .themes.push([
            {
                title: theme,
                rating: grade,
                date: Date.now()
            }]);

        await this.updateStudentRecord(ctx, studentEmail, record);

        return JSON.stringify(record, null, 2);
    }
}

module.exports = StudentRecordsStorage;
