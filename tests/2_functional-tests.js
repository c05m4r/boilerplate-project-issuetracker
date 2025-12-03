const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

const PROJECT = 'apitest';

suite('Functional Tests', function() {
	let fullIssueId;
	let requiredOnlyIssueId;

	suite('Create Issue', function() {
		test('Create an issue with every field: POST request to /api/issues/{project}', function(done) {
			chai.request(server)
				.post(`/api/issues/${PROJECT}`)
				.send({
					issue_title: 'Full Issue',
					issue_text: 'Full issue text',
					created_by: 'Tester',
					assigned_to: 'Dev One',
					status_text: 'In QA'
				})
				.end(function(err, res) {
					assert.equal(res.status, 200);
					assert.equal(res.body.issue_title, 'Full Issue');
					assert.equal(res.body.issue_text, 'Full issue text');
					assert.equal(res.body.created_by, 'Tester');
					assert.equal(res.body.assigned_to, 'Dev One');
					assert.equal(res.body.status_text, 'In QA');
					assert.property(res.body, 'created_on');
					assert.property(res.body, 'updated_on');
					assert.property(res.body, '_id');
					assert.isTrue(res.body.open);
					fullIssueId = res.body._id;
					done();
				});
		});

		test('Create an issue with only required fields: POST request to /api/issues/{project}', function(done) {
			chai.request(server)
				.post(`/api/issues/${PROJECT}`)
				.send({
					issue_title: 'Required Only',
					issue_text: 'Just the essentials',
					created_by: 'Tester'
				})
				.end(function(err, res) {
					assert.equal(res.status, 200);
					assert.equal(res.body.issue_title, 'Required Only');
					assert.equal(res.body.issue_text, 'Just the essentials');
					assert.equal(res.body.created_by, 'Tester');
					assert.equal(res.body.assigned_to, '');
					assert.equal(res.body.status_text, '');
					assert.property(res.body, '_id');
					requiredOnlyIssueId = res.body._id;
					done();
				});
		});

		test('Create an issue with missing required fields: POST request to /api/issues/{project}', function(done) {
			chai.request(server)
				.post(`/api/issues/${PROJECT}`)
				.send({
					issue_title: 'Missing fields'
				})
				.end(function(err, res) {
					assert.equal(res.status, 200);
					assert.deepEqual(res.body, { error: 'required field(s) missing' });
					done();
				});
		});
	});

	suite('View Issues', function() {
		test('View issues on a project: GET request to /api/issues/{project}', function(done) {
			chai.request(server)
				.get(`/api/issues/${PROJECT}`)
				.end(function(err, res) {
					assert.equal(res.status, 200);
					assert.isArray(res.body);
					assert.isAtLeast(res.body.length, 2);
					done();
				});
		});

		test('View issues on a project with one filter: GET request to /api/issues/{project}', function(done) {
			chai.request(server)
				.get(`/api/issues/${PROJECT}`)
				.query({ _id: fullIssueId })
				.end(function(err, res) {
					assert.equal(res.status, 200);
					assert.isArray(res.body);
					assert.lengthOf(res.body, 1);
					assert.equal(res.body[0]._id, fullIssueId);
					done();
				});
		});

		test('View issues on a project with multiple filters: GET request to /api/issues/{project}', function(done) {
			chai.request(server)
				.get(`/api/issues/${PROJECT}`)
				.query({ _id: fullIssueId, open: true })
				.end(function(err, res) {
					assert.equal(res.status, 200);
					assert.isArray(res.body);
					assert.lengthOf(res.body, 1);
					assert.equal(res.body[0]._id, fullIssueId);
					assert.isTrue(res.body[0].open);
					done();
				});
		});
	});

	suite('Update Issue', function() {
		test('Update one field on an issue: PUT request to /api/issues/{project}', function(done) {
			chai.request(server)
				.put(`/api/issues/${PROJECT}`)
				.send({ _id: fullIssueId, issue_text: 'Updated text' })
				.end(function(err, res) {
					assert.equal(res.status, 200);
					assert.deepEqual(res.body, { result: 'successfully updated', _id: fullIssueId });
					done();
				});
		});

		test('Update multiple fields on an issue: PUT request to /api/issues/{project}', function(done) {
			chai.request(server)
				.put(`/api/issues/${PROJECT}`)
				.send({ _id: fullIssueId, issue_title: 'Full Issue Updated', open: false })
				.end(function(err, res) {
					assert.equal(res.status, 200);
					assert.deepEqual(res.body, { result: 'successfully updated', _id: fullIssueId });
					done();
				});
		});

		test('Update an issue with missing _id: PUT request to /api/issues/{project}', function(done) {
			chai.request(server)
				.put(`/api/issues/${PROJECT}`)
				.send({ issue_title: 'No ID' })
				.end(function(err, res) {
					assert.equal(res.status, 200);
					assert.deepEqual(res.body, { error: 'missing _id' });
					done();
				});
		});

		test('Update an issue with no fields to update: PUT request to /api/issues/{project}', function(done) {
			chai.request(server)
				.put(`/api/issues/${PROJECT}`)
				.send({ _id: fullIssueId })
				.end(function(err, res) {
					assert.equal(res.status, 200);
					assert.deepEqual(res.body, { error: 'no update field(s) sent', _id: fullIssueId });
					done();
				});
		});

		test('Update an issue with an invalid _id: PUT request to /api/issues/{project}', function(done) {
			chai.request(server)
				.put(`/api/issues/${PROJECT}`)
				.send({ _id: 'invalidid', issue_text: 'does not matter' })
				.end(function(err, res) {
					assert.equal(res.status, 200);
					assert.deepEqual(res.body, { error: 'could not update', _id: 'invalidid' });
					done();
				});
		});
	});

	suite('Delete Issue', function() {
		test('Delete an issue: DELETE request to /api/issues/{project}', function(done) {
			chai.request(server)
				.delete(`/api/issues/${PROJECT}`)
				.send({ _id: requiredOnlyIssueId })
				.end(function(err, res) {
					assert.equal(res.status, 200);
					assert.deepEqual(res.body, { result: 'successfully deleted', _id: requiredOnlyIssueId });
					done();
				});
		});

		test('Delete an issue with an invalid _id: DELETE request to /api/issues/{project}', function(done) {
			chai.request(server)
				.delete(`/api/issues/${PROJECT}`)
				.send({ _id: 'badid' })
				.end(function(err, res) {
					assert.equal(res.status, 200);
					assert.deepEqual(res.body, { error: 'could not delete', _id: 'badid' });
					done();
				});
		});

		test('Delete an issue with missing _id: DELETE request to /api/issues/{project}', function(done) {
			chai.request(server)
				.delete(`/api/issues/${PROJECT}`)
				.send({})
				.end(function(err, res) {
					assert.equal(res.status, 200);
					assert.deepEqual(res.body, { error: 'missing _id' });
					done();
				});
		});
	});
});
