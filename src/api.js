// src/api.js

// fragments microservice API to use, defaults to localhost:8080 if not set in env
const apiUrl = process.env.API_URL || 'http://localhost:8080';

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
      // Append the fragment list to the unordered list element
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
