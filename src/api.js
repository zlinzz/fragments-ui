// src/api.js

// fragments microservice API to use, defaults to localhost:8080 if not set in env
const apiUrl = process.env.API_URL || 'http://localhost:8080';
const { getUser } = require('./auth');

/**
 * Given an authenticated user, request all fragments for this user from the
 * fragments microservice (currently only running locally). We expect a user
 * to have an `idToken` attached, so we can send that along with the request.
 */
export async function getUserFragments(user) {
  console.log('Requesting user fragments data...');
  try {
    const res = await fetch(`${apiUrl}/v1/fragments?expand=1`, {
      // Generate headers with the proper Authorization bearer token to pass.
      // We are using the `authorizationHeaders()` helper method we defined
      // earlier, to automatically attach the user's ID token.
      headers: user.authorizationHeaders(),
    });

    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    console.log('Successfully got user fragments data', { data });
    return data;
  } catch (err) {
    console.error('Unable to call GET /v1/fragment', { err });
  }
}

export async function createFragment(user, type, data) {
  console.log('Creating a new fragment...');

  const fragmentCreateStatus = document.querySelector('#fragmentCreateStatus');
  const Message = fragmentCreateStatus.querySelector('.status-message');

  // Clear any previous status message
  Message.innerHTML = '';

  try {
    const res = await fetch(`${apiUrl}/v1/fragments`, {
      method: 'POST',
      headers: {
        ...user.authorizationHeaders(),
        'Content-Type': type, // Send desired type
      },
      body: data, // Send the fragment body directly
    });

    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`);
    }

    // Assign success message
    Message.textContent = 'Fragment created successfully!';
    Message.style.color = 'green';

    const response = await res.json();
    console.log('Successfully created fragment', { response });
    return response;
  } catch (err) {
    // Assign Fail message
    Message.textContent = `Failed to create fragment: ${err.message}`;
    Message.style.color = 'red';

    console.error('Unable to create fragment', { err });
    return null;
  }
}

// Open the modal
function openUpdateModal(fragment) {
  const modal = document.getElementById('updateFragmentModal');
  // Use flex to center the modal
  modal.style.display = 'flex';

  // Get modal form elements
  const fragmentFileInputM = document.querySelector('#fragmentFileM');
  const fragmentDataInputM = document.querySelector('#fragmentDataM');
  const fragmentTypeInputM = document.querySelector('#fragmentTypeM');

  fragmentFileInputM.value = '';
  fragmentDataInputM.value = '';
  // Pre-defined the fragment type input as original one
  fragmentTypeInputM.value = fragment.type;

  // Regulate the input fields based on the file input
  // Set up event listeners for dynamic adjustments (modification
  // after open the modal)
  fragmentFileInputM.addEventListener('change', () => {
    if (fragmentFileInputM.files.length > 0) {
      fragmentDataInputM.required = false;
      fragmentDataInputM.disabled = true;
      fragmentDataInputM.value = '';

      fragmentTypeInputM.value =
        fragmentFileInputM.files[0].type || 'Unable to detect type, please input manually';
      if (fragmentTypeInputM.value === 'Unable to detect type, please input manually') {
        fragmentTypeInputM.style.color = 'red';
      } else {
        fragmentTypeInputM.style.color = '';
      }
    } else {
      fragmentDataInputM.required = true;
      fragmentDataInputM.disabled = false;

      fragmentTypeInputM.style.color = '';
      fragmentTypeInputM.value = fragment.type;
    }
  });

  fragmentTypeInputM.addEventListener('input', () => {
    fragmentTypeInputM.style.color = '';
  });
}

export function displayFragments(fragments) {
  const fragmentListContainer = document.querySelector('#fragmentListContainer');

  // Clear all existing list before appending new content
  fragmentListContainer.innerHTML = '';

  if (fragments.length > 0) {
    const fragmentList = document.createElement('ul');
    fragments.forEach((fragment) => {
      const fragmentItem = document.createElement('li');
      fragmentItem.innerHTML = `
        <strong>ID:</strong> ${fragment.id}<br>
        <strong>Created:</strong> ${new Date(fragment.created).toLocaleString()}<br>
        <strong>Updated:</strong> ${new Date(fragment.updated).toLocaleString()}<br>
        <strong>Type:</strong> ${fragment.type}<br>
        <strong>Size:</strong> ${fragment.size} <br/>
      `;

      // Create a delete button
      const deleteButton = document.createElement('button');
      deleteButton.textContent = 'Delete';
      deleteButton.style.marginRight = '10px';

      // Add event listener to delete button
      deleteButton.addEventListener('click', async () => {
        const user = await getUser();
        const isDeleted = await deleteFragment(user, fragment.id);
        if (isDeleted) {
          // Re-fetch and update the fragment list after successful deletion
          const updatedFragments = await getUserFragments(user);
          displayFragments(updatedFragments.fragments);
        }
      });

      // Create an update button
      const updateButton = document.createElement('button');
      updateButton.textContent = 'Update';

      // Add event listener to the update button to open the modal for updating
      updateButton.addEventListener('click', () => {
        openUpdateModal(fragment);
      });

      // Append the delete, update button, and fragment list to the unordered list element
      fragmentItem.appendChild(deleteButton);
      fragmentItem.appendChild(updateButton);
      fragmentList.appendChild(fragmentItem);
    });

    // Append the unordered list to the fragmentListContainer
    fragmentListContainer.appendChild(fragmentList);
  } else {
    // Create and assign fragment not found message
    const noFragmentsMessage = document.createElement('p');
    noFragmentsMessage.textContent = 'No fragments found.';
    noFragmentsMessage.style.color = 'red';
    fragmentListContainer.appendChild(noFragmentsMessage);
  }
}

export async function deleteFragment(user, fragmentId) {
  console.log(`Deleting fragment with ID: ${fragmentId}`);
  try {
    const res = await fetch(`${apiUrl}/v1/fragments/${fragmentId}`, {
      method: 'DELETE',
      headers: user.authorizationHeaders(),
    });

    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`);
    }

    console.log('Successfully deleted fragment');
    return true;
  } catch (err) {
    console.error('Unable to delete fragment:', err);
    return false;
  }
}
