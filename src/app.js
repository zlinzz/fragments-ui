// src/app.js

import { Auth, getUser } from './auth';
import { getUserFragments } from './api';
import { createFragment } from './api';

async function init() {
  // Get our UI elements
  const userSection = document.querySelector('#user');
  const loginBtn = document.querySelector('#login');
  const logoutBtn = document.querySelector('#logout');
  const fragmentPostForm = document.querySelector('#fragmentPostFormSection');

  // Wire up event handlers to deal with login and logout.
  loginBtn.onclick = () => {
    // Sign-in via the Amazon Cognito Hosted UI (requires redirects), see:
    // https://docs.amplify.aws/lib/auth/advanced/q/platform/js/#identity-pool-federation
    Auth.federatedSignIn();
  };
  logoutBtn.onclick = () => {
    // Sign-out of the Amazon Cognito Hosted UI (requires redirects), see:
    // https://docs.amplify.aws/lib/auth/emailpassword/q/platform/js/#sign-out
    Auth.signOut();
  };

  // See if we're signed in (i.e., we'll have a `user` object)
  const user = await getUser();
  if (!user) {
    // Disable the Logout button
    logoutBtn.disabled = true;
    return;
  }

  // Log the user info for debugging purposes
  console.log({ user });

  // Do an authenticated request to the fragments API server and log the result
  // const userFragments = await getUserFragments(user);
  await getUserFragments(user);

  // TODO: later in the course, we will show all the user's fragments in the HTML...

  // Update the UI to welcome the user
  userSection.hidden = false;

  // Show the user's username
  userSection.querySelector('.username').innerText = user.username;

  // Disable the Login button
  loginBtn.disabled = true;

  // Update the UI to allow POST after user logged in
  fragmentPostForm.hidden = false;

  fragmentPostForm.onsubmit = async (event) => {
    event.preventDefault(); // Prevent default submit normally

    const type = document.querySelector('#fragmentType').value; // Get fragment type
    const data = document.querySelector('#fragmentData').value; // Get fragment data
    try {
      await createFragment(user, type, data);
    } catch (err) {
      console.error('Failed to create fragment:', err);
    }
  };
}

// Wait for the DOM to be ready, then start the app
addEventListener('DOMContentLoaded', init);
