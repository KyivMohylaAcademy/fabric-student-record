'use strict';

const { Contract } = require('fabric-contract-api');
const { ClientIdentity } = require('fabric-shim');

class StudentsStorage extends Contract {
    constructor() {
        super('org.fabric.keyvaluestorage');
    }

    async createRecords(data, email, fullName) {
        const identity = new ClientIdentity(data.stub);
        if (identity.cert.subject.organizationalUnitName !== 'admin') {
            throw new Error("No acces");
        }
        const recordAsBytes = await data.stub.getState(email);
        if (recordAsBytes && recordAsBytes.toString().length !== 0) {
            throw new Error("Student with this email already exists");
        }
        const record = {
            fullName: fullName,
            semesters: []
        }
        const newRecordInBytes = Buffer.from(JSON.stringify(record));
        await data.stub.putState(email, newRecordInBytes);
        return JSON.stringify(record, null, 4);
    }

    async getRecords(data, email) {
        const identity = new ClientIdentity(data.stub);
        if (identity.cert.subject.organizationalUnitName !== 'admin') {
            throw new Error("No access");
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

    async addSubject(data, email, semester, subject) {
        const record = await getStudentRecord(data, email);
        const teacherEmail = identity.cert.subject.commonName;
        if (!record.semesters[semester]) {
            record.semesters[semester] = {};
        }
        record.semesters[semester][subject] = {
            lector: teacherEmail,
            themes: []
        }
        await updateStudentRecord(data, email, record);
        return JSON.stringify(record, null, 4);
    }

    async addGrade(data, email, semester, subject, theme, grade) {
        const record = await getStudentRecord(data, email);
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
        await updateStudentRecord(data, email, record);
        return JSON.stringify(record, null, 4);
    }

    async getAllGrades(data, email) {
        const record = await getStudentRecord(data, email);
        return JSON.stringify(record.semesters, null, 4);
    }

    async getStudentGradesAggSemester(data, email, semester) {
        const record = await getStudentRecord(data, email);
        return JSON.stringify(record.semesters[semester] || [], null, 4);
    }
}

module.exports = StudentsStorage;
