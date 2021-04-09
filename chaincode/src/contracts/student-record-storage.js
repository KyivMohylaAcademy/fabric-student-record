class StudentRecordsStorage extends Contract {
    constructor() {
        super('org.fabric.studentRecordsStorage');
    }

    async addGradeToStudentRecord(ctx, studentEmail, semester, subjectName, title, grade) {
        const record = await this.getStudent(ctx, studentEmail);

        if (!record.semesters[semester]?.[subjectName]) {
            throw new Error("The subject you entered does not exist in this semester.");
        }

        const theme = {
            title,
            grade,
            date: Date.now(),
        };

        record.semesters[semester][subjectName].themes.push(theme);

        const newRecordInBytes = Buffer.from(JSON.stringify(record));

        await ctx.stub.putState(studentEmail, newRecordInBytes);

        return JSON.stringify(record, null, 2);
    }

    async createSubjectToStudentRecord(ctx,studentEmail, fullName) {
        const identity = new ClientIdentity(ctx.stub);

        if (identity.cert.subject.organizationalUnitName !== 'admin'){
            throw new Error('Only admin has access to this function')
        }

        const recordAsBytes = await ctx.stub.getState(studentEmail);

        if (!!recordAsBytes && recordAsBytes.length !== 0){
            throw new Error("The student with such email already exists.")
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
            throw new Error('Current user does not have admin rights.')
        }

        const recordAsBytes = await ctx.stub.getState(studentEmail);

        if (recordAsBytes.length === 0){
            throw new Error("The student with such email already exists.")
        }

        const recordAsObject = JSON.parse(recordAsBytes.toString());

        if (recordAsObject.semesters[semesterNumber]){
            if (recordAsObject.semesters[semesterNumber][subjectName]){
                throw new Error("The student already has this subject.")
            }

            else
                recordAsObject.semesters[semesterNumber][subjectName] = {
                    lector: identity.cert.subject.lectorEmail,
                    themes: []
                }

        } else
            recordAsObject.semesters[semesterNumber] = {
                [subjectName]: {
                    lector: identity.cert.subject.lectorEmail,
                    themes: []
                }
            }

        await ctx.stub.putState(studentEmail,Buffer.from(JSON.stringify(recordAsObject)))

        return JSON.stringify(recordAsObject,null,2);
    }

    async getStudentRecord(ctx,studentEmail) {
        const recordAsBytes = await ctx.stub.getState(studentEmail);

        if (recordAsBytes.length === 0){
            throw new Error("The Student account with such email you entered does not exist.")
        }
        const recordAsObject = JSON.parse(recordAsBytes.toString())
        return JSON.stringify(recordAsObject.semesters,null,2);
    }

    async getStudentGragesBySemester(ctx, studentEmail, semester) {
        const identity = new ClientIdentity(ctx.stub);

        const record = await this.getStudent(ctx, studentEmail);

        const grades = record.semesters[semester] || [];

        return JSON.stringify(grades, null, 2);
    }
}

module.exports = StudentRecordsStorage;
