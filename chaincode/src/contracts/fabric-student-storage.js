
'use strict';

const { Contract } = require('fabric-contract-api');
const { ClientIdentity } = require('fabric-shim');

class FabricStudentStorage extends Contract {
    constructor() {
        super('org.fabric.keyvaluestorage');
    }

    async createStudentRec(data, studentEmail, fullName) {
        const id = new ClientIdentity(data.stub);
        if (id.cert.subject.orgUnitName !== 'admin') {
            throw new Error("Access error");
        }
        const recordAsBytes = await data.stub.getState(studentEmail);

        if (recordAsBytes && recordAsBytes.toString().length !== 0) {
            throw new Error("User already exists");
        }

        const record = {
            fullName: fullName,
            semesters: []
        }
        const newRecordInBytes = Buffer.from(JSON.stringify(record));
        await data.stub.putState(studentEmail, newRecordInBytes);
        return JSON.stringify(record, null, 4);
    }

    async getRecords(data, email) {
        const identity = new ClientIdentity(data.stub);
        if (identity.cert.subject.orgUnitName !== 'admin') {
            throw new Error("Access error");
        }
        const record = await data.stub.getState(email);
        if (!record || record.toString().length === 0) {
            throw new Error("No user with this email");
        }
        return JSON.parse(record.toString());
    }

    async updateRecords(data, email, record) {
        const recordBytes = Buffer.from(JSON.stringify(record));
        await data.stub.putState(email, recordBytes);
    }

    async addSubject(data, studentEmail, semester, subject) {
        const record = await getStudentRecord(data, studentEmail);
        const teacherEmail = identity.cert.subject.commonName;
        if (!record.semesters[semester]) {
            record.semesters[semester] = {};
        }
        record.semesters[semester][subject] = {
            lector: teacherEmail,
            themes: []
        }
        await updateStudentRecord(data, studentEmail, record);
        return JSON.stringify(record, null, 4);
    }

    async createGrade(data, studentEmail, semester, subject, theme, grade) {
        const record = await getStudentRecord(data, studentEmail);
        if (!record.semesters[semester]?.[subject]) {
            throw new Error("This subject is absent in the specified semester");
        }
        record.semesters[semester][subject].themes.push([
            {
                title: theme,
                rating: grade,
                date: Date.now()
            }
        ]);
        await updateStudentRecord(data, studentEmail, record);
        return JSON.stringify(record, null, 4);
    }

    async getAllGrades(data, studentEmail) {
        const record = await getStudentRecord(data, studentEmail);
        return JSON.stringify(record.semesters, null, 4);
    }

    async getStudentGradesBySemester(data, studentEmail, semester) {
        const record = await getStudentRecord(data, studentEmail);
        return JSON.stringify(record.semesters[semester] || [], null, 4);
    }
}

module.exports = FabricStudentStorage;