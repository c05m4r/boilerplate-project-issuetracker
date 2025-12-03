'use strict';

const { randomBytes } = require('crypto');

const projects = new Map();

function getIssuesForProject(project) {
  if (!projects.has(project)) {
    projects.set(project, []);
  }
  return projects.get(project);
}

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
  
    .get(function (req, res){
      const project = req.params.project;
      const issues = getIssuesForProject(project);
      const filters = req.query || {};

      const filtered = issues.filter(issue => {
        return Object.entries(filters).every(([key, value]) => {
          if (value === undefined) {
            return true;
          }
          if (key === 'open') {
            return issue.open === normalizeBoolean(value);
          }
          if (!(key in issue)) {
            return false;
          }
          const issueValue = issue[key];
          if (issueValue instanceof Date) {
            const filterDate = new Date(value);
            if (Number.isNaN(filterDate.getTime())) {
              return false;
            }
            return issueValue.toISOString() === filterDate.toISOString();
          }
          return issueValue.toString() === value.toString();
        });
      });

      return res.json(filtered);
    })
    
    .post(function (req, res){
      const project = req.params.project;
      const { issue_title, issue_text, created_by } = req.body;
      const assigned_to = req.body.assigned_to || '';
      const status_text = req.body.status_text || '';

      if (!issue_title || !issue_text || !created_by) {
        return res.json({ error: 'required field(s) missing' });
      }

      const now = new Date();
      const issue = {
        _id: randomBytes(12).toString('hex'),
        issue_title,
        issue_text,
        created_by,
        assigned_to,
        status_text,
        created_on: now,
        updated_on: now,
        open: true
      };

      const issues = getIssuesForProject(project);
      issues.push(issue);

      return res.json(issue);
    })
    
    .put(function (req, res){
      const project = req.params.project;
      const { _id } = req.body;

      if (!_id) {
        return res.json({ error: 'missing _id' });
      }

      const issues = getIssuesForProject(project);
      const issue = issues.find(item => item._id === _id);

      if (!issue) {
        return res.json({ error: 'could not update', _id });
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

      Object.assign(issue, updates);
      issue.updated_on = new Date();

      return res.json({ result: 'successfully updated', _id });
    })
    
    .delete(function (req, res){
      const project = req.params.project;
      const { _id } = req.body;

      if (!_id) {
        return res.json({ error: 'missing _id' });
      }

      const issues = getIssuesForProject(project);
      const index = issues.findIndex(item => item._id === _id);

      if (index === -1) {
        return res.json({ error: 'could not delete', _id });
      }

      issues.splice(index, 1);
      return res.json({ result: 'successfully deleted', _id });
    });
    
};
