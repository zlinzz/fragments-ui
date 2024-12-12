// src/app.js

import { Auth, getUser } from './auth';
import { getUserFragments, createFragment, displayFragments } from './api';

async function init() {
  // Get our UI elements
  const userSection = document.querySelector('#user');
  const loginBtn = document.querySelector('#login');
  const logoutBtn = document.querySelector('#logout');
  // POST form elements
  const fragmentPostFormSection = document.querySelector('#fragmentPostFormSection');
  const fragmentPostForm = document.querySelector('#fragmentPostForm');
  // Get the text, file, type input elements
  const fragmentDataInput = document.querySelector('#fragmentData');
  const fragmentFileInput = document.querySelector('#fragmentFile');
  const fragmentTypeInput = document.querySelector('#fragmentType');
  // Show fragment list elements
  const fragmentListSection = document.querySelector('#fragmentListSection');
  const fragmentListContainer = document.querySelector('#fragmentListContainer');
  // Update fragment modal elements
  const closeUpdateModalBtn = document.querySelector('#closeUpdateModal');
  // Convert fragment modal elements
  const closeConvertModalBtn = document.querySelector('#closeConvertModal');

  // Set required attribute for fragmentDataInput and fragmentTypeInput
  // Set fragment type input placeholder and value based on the file input state
  function toggleRequiredFields() {
    if (fragmentFileInput.files.length > 0) {
      fragmentDataInput.required = false;
      fragmentDataInput.disabled = true;
      fragmentDataInput.value = '';

      // Set the fragment type to the file type when a file is selected
      // keep the type input not disabled, since .type does not know some type
      fragmentTypeInput.value =
        fragmentFileInput.files[0].type || 'Unable to detect type, please input manually';
      if (fragmentTypeInput.value === 'Unable to detect type, please input manually') {
        fragmentTypeInput.style.color = 'red';
      } else {
        fragmentTypeInput.style.color = '';
      }
    } else {
      fragmentDataInput.required = true;
      fragmentDataInput.disabled = false;

      // Clear the type if no file is selected
      fragmentTypeInput.style.color = '';
      fragmentTypeInput.value = '';
    }
  }
  // Once there is a new input, remove the color
  fragmentTypeInput.addEventListener('input', () => {
    fragmentTypeInput.style.color = '';
  });

  // Add event listener to file input to handle the toggle
  fragmentFileInput.addEventListener('change', toggleRequiredFields);
  // Also toggle on page load in case a file was pre-selected (e.g., after a form reset)
  toggleRequiredFields();

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

  // Do an authenticated request to the fragments API server to get fragments
  const userFragments = await getUserFragments(user);

  // Update the UI to welcome the user
  userSection.hidden = false;
  // Show the user's username
  userSection.querySelector('.username').innerText = user.username;

  // Display User Fragment List Metadata Title
  fragmentListSection.hidden = false;
  fragmentListSection.querySelector('.username').innerText = user.username;
  // Initially display the user's fragments' metadata
  displayFragments(userFragments.fragments);

  // Disable the Login button
  loginBtn.disabled = true;

  // Update the UI to allow POST after user logged in
  fragmentPostFormSection.hidden = false;

  fragmentPostFormSection.onsubmit = async (event) => {
    // Prevent default submit normally
    event.preventDefault();
    let fragmentData = '';
    let type = fragmentTypeInput.value;

    const file = fragmentFileInput.files[0];
    if (file) {
      fragmentData = file;
    } else {
      fragmentData = fragmentDataInput.value;
    }

    try {
      await createFragment(user, type, fragmentData);
      fragmentPostForm.reset();

      const updatedUserFragments = await getUserFragments(user);
      fragmentListContainer.innerHTML = '';
      displayFragments(updatedUserFragments.fragments);
    } catch (err) {
      console.error('Failed to create fragment:', err);
    }
  };

  // Once the user click on the display fragment area, all html
  // status message on the create fragment form will be cleared
  fragmentListContainer.addEventListener('click', () => {
    const Message = document.querySelector('#createFragmentStatus');
    Message.innerHTML = '';
  });

  // Add event listener to close the update modal
  closeUpdateModalBtn.addEventListener('click', () => {
    const modal = document.getElementById('updateFragmentModal');
    // Hide the modal
    modal.style.display = 'none';
  });

  // Add event listener to close the convert modal
  closeConvertModalBtn.addEventListener('click', () => {
    const modal = document.getElementById('convertFragmentModal');
    modal.style.display = 'none';
  });
}

// Wait for the DOM to be ready, then start the app
addEventListener('DOMContentLoaded', init);
