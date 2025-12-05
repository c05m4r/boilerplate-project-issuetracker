'use strict';

require('../db-connection');
const IssueModel = require('../models').Issue;

function normalizeBoolean(value) {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') {
      return true;
    }
    if (value.toLowerCase() === 'false') {
      return false;
    }
  }
  return value;
}

module.exports = function (app) {

  app.route('/api/issues/:project')
  
    .get(async function (req, res){
      const project = req.params.project;
      const filters = { projectId: project };
      Object.entries(req.query || {}).forEach(([key, value]) => {
        if (value === undefined) {
          return;
        }
        if (key === 'open') {
          filters.open = normalizeBoolean(value);
          return;
        }
        filters[key] = value;
      });
      try {
        const issues = await IssueModel.find(filters).lean();
        return res.json(issues);
      } catch (err) {
        return res.json([]);
      }
    })
    
    .post(async function (req, res){
      const project = req.params.project;
      const { issue_title, issue_text, created_by } = req.body;
      const assigned_to = req.body.assigned_to || '';
      const status_text = req.body.status_text || '';

      if (!issue_title || !issue_text || !created_by) {
        return res.json({ error: 'required field(s) missing' });
      }

      const now = new Date();
      try {
        const issue = await IssueModel.create({
          projectId: project,
          issue_title,
          issue_text,
          created_by,
          assigned_to,
          status_text,
          created_on: now,
          updated_on: now,
          open: true
        });
        return res.json(issue);
      } catch (err) {
        return res.json({ error: 'required field(s) missing' });
      }
    })
    
    .put(async function (req, res){
      const project = req.params.project;
      const { _id } = req.body;

      if (!_id) {
        return res.json({ error: 'missing _id' });
      }
      const updates = {};
      Object.entries(req.body).forEach(([key, value]) => {
        if (key === '_id' || value === undefined || value === '') {
          return;
        }
        updates[key] = key === 'open' ? normalizeBoolean(value) : value;
      });

      if (Object.keys(updates).length === 0) {
        return res.json({ error: 'no update field(s) sent', _id });
      }

      updates.updated_on = new Date();

      try {
        const result = await IssueModel.findOneAndUpdate(
          { _id, projectId: project },
          updates,
          { new: true }
        );
        if (!result) {
          return res.json({ error: 'could not update', _id });
        }
        return res.json({ result: 'successfully updated', _id });
      } catch (err) {
        return res.json({ error: 'could not update', _id });
      }
    })
    
    .delete(async function (req, res){
      const project = req.params.project;
      const { _id } = req.body;

      if (!_id) {
        return res.json({ error: 'missing _id' });
      }

      try {
        const result = await IssueModel.findOneAndDelete({ _id, projectId: project });
        if (!result) {
          return res.json({ error: 'could not delete', _id });
        }
        return res.json({ result: 'successfully deleted', _id });
      } catch (err) {
        return res.json({ error: 'could not delete', _id });
      }
    });
    
};
