/*
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as core from '@actions/core';
import { CloudRun } from './cloudRun';
import { Action, Service } from './service';

/**
 * Executes the main action. It includes the main business logic and is the
 * primary entry point. It is documented inline.
 */
async function run(): Promise<void> {
  try {
    // Get inputs
    const image = core.getInput('image');
    const name = core.getInput('service');
    const envVars = core.getInput('env_vars');
    const yaml = core.getInput('metadata');
    const credentials = core.getInput('credentials');
    const projectId = core.getInput('project_id');
    const action = (core.getInput('action') || 'deploy') as Action;
    const region = core.getInput('region') || 'us-central1';

    if (!Object.values(Action).includes(action)) {
      throw new Error(`Invalid action: ${action}`);
    }

    // Create Cloud Run client
    const client = new CloudRun(region, { projectId, credentials });

    // Initialize service
    const service = new Service({
      action,
      image,
      name,
      envVars,
      yaml,
    });

    let url = null;
    if (action === Action.Delete) {
      await client.delete(service);
    } else {
      // Deploy service
      url = await client.deploy(service);
    }

    // Set URL as output
    core.setOutput('url', url);
  } catch (error) {
    core.info(JSON.stringify(error.response));
    core.info(JSON.stringify(error.config));
    core.info(JSON.stringify(error.errors));
    core.setFailed(error.message);
  }
}

run();
