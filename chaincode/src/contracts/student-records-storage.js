'use strict';

const { Contract } = require('fabric-contract-api');
const { ClientIdentity } = require('fabric-shim');

class StudentRecordsStorage extends Contract {
  constructor() {
    super('org.fabric.studentRecordsStorage');
  }

  async createStudentRecord(ctx) {
    const identity = new ClientIdentity(ctx.stub);

  }
}

module.exports = StudentRecordsStorage;
