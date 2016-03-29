
module.exports = function (server, conf) {
	
	var handlers = require('./dataprovider.handlers')(server, conf);
	var Joi = require('joi');

	var parameter = Joi.object().keys({
		flag: Joi.string().allow(''),
      	name: Joi.string().allow('')
	});

	var output = Joi.object().keys({
		type: Joi.string().valid('file', 'directory'), 
      	name: Joi.string()
	});

	var input = Joi.object().keys({
      	name: Joi.string(),
      	remote : Joi.object().keys({
      		serverCodename: Joi.string().optional(),
      		uri: Joi.string()
      	}).optional()
	});

	var JobPost = Joi.object().keys({
			type: Joi.string().required(),
			userEmail: Joi.string().required(),			
			executionserver: Joi.string().required(),
			jobparameters: Joi.array().items(parameter).optional(),
			executable: Joi.string().required(),			
			parameters: Joi.array().items(parameter).min(1),
			inputs: Joi.array().items(input).min(1),
			outputs: Joi.array().items(output).min(1)
        });

	var Joijobstatus = Joi.object().keys({
			status: Joi.string().valid('CREATE', 'DOWNLOADING', 'RUN', 'FAIL', 'KILL', 'UPLOADING', 'EXIT', 'DONE'),
			jobid: Joi.number().optional(),
			stat: Joi.optional(),
			error: Joi.optional(),
			downloadstatus: Joi.array().items(Joi.object()).optional(),
			uploadstatus: Joi.array().items(Joi.object()).optional()
		});

	var Job = Joi.object().keys({
			_id: Joi.string().alphanum().required(),
			_rev: Joi.string().required(),
			type: Joi.string().required(),
			userEmail: Joi.string().email().required(),
			timestamp: Joi.date().required(),
			jobstatus: Joijobstatus.required(),
			executable: Joi.string().required(),
			executionserver: Joi.string().required(),
			jobparameters: Joi.optional(),
			parameters: Joi.array().items(parameter).min(1),			
			inputs: Joi.array().items(input).min(1),
			outputs: Joi.array().items(output).min(1),
			_attachments: Joi.optional()
	    });

			

	server.route({
		path: '/dataprovider',
		method: 'POST',
		config: {
			handler: handlers.createJob,
			validate: {
				query: false,
		        payload: JobPost,
		        params: false
			},
			payload:{
				output: 'data'
			},
			description: 'This route will be used to post job documents to the couch database.'
		}
	});

	server.route({
		path: '/dataprovider',
		method: 'PUT',
		config: {
			handler: handlers.updateJob,
			validate: {
				query: false,
		        payload: Job,
		        params: false
			},
			payload:{
				output: 'data'
			},
			description: 'This route will be used to update a job document in the couch database.'
		}
	});

	server.route({
		method: 'PUT',
		path: "/dataprovider/{id}/{name}",
		config: {
			handler: handlers.addData,
	      	validate: {
		      	query: false,
		        params: {
		        	id: Joi.string().alphanum().required(),
		        	name: Joi.string().required()
		        },
		        payload: true
		    },
		    payload: {
	        	maxBytes: 1024 * 1024 * 1024,
	    		output: 'stream'
	        },
		    description: 'Add attachment data'
	    }
	});
	

	server.route({
		method: 'GET',
		path: "/dataprovider/{id}",
		config: {
			handler: handlers.getJob,
			validate: {
			  	query: false,
			    params: {
			    	id: Joi.string().alphanum().required()
			    }, 
			    payload: false
			},
			response: {
				schema: Job
			},
			description: 'Get the job document posted to the database'
	    }
	});

	server.route({
		method: 'GET',
		path: "/dataprovider/user",
		config: {
			handler: handlers.getUserJobs,
			validate: {
			  	query: Joi.object().keys({
			  		userEmail: Joi.string().email().required(),
			  		jobstatus: Joi.string().optional(),
			  		executable: Joi.string().optional()
			  	}), 
			  	params: false
			},
			response: {
				schema: Joi.array().items(Job).min(0)
			},
			description: 'Get the jobs posted to the database for a user.'
	    }
	});

	server.route({
		method: 'GET',
		path: "/dataprovider/{id}/{name}",
		config: {
			handler: handlers.getJob,
			validate: {
			  	query: false,
			    params: {
			    	id: Joi.string().alphanum().required(),
			    	name: Joi.string().required()
			    },
			    payload: false
			},
			description: 'Get a specific attachment of the document posted to the database.',
      		cache : { expiresIn: 60 * 30 * 1000 }
	    }
	});

}
