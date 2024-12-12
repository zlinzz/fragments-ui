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

// Get fragment data by id
export async function getFragmentData(user, fragmentId) {
  console.log("Requesting a fragment's data...");
  try {
    const res = await fetch(`${apiUrl}/v1/fragments/${fragmentId}`, {
      headers: user.authorizationHeaders(),
    });

    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`);
    }

    // Check the content type
    const contentType = res.headers.get('Content-Type');
    // if returns image
    if (contentType && contentType.startsWith('image/')) {
      // Handle binary image data
      const blob = await res.blob();
      console.log('Image Blob received:', blob);

      const imgElement = document.createElement('img');
      // Generates a URL for the Blob
      imgElement.src = URL.createObjectURL(blob);
      console.log('Image element created with src:', imgElement.src);

      return imgElement;
    } else {
      // Handle text or other types of data
      const data = await res.text();
      console.log("Successfully got fragment's data", { data, type: contentType });
      return data;
    }
  } catch (err) {
    console.error("Unable to get fragment's data by id (GET /v1/fragment/:id)", { err });
  }
}

// Convert fragment data by id and ext
export async function convertFragment(user, fragmentId, targetType) {
  console.log("Converting a fragment's data...");
  try {
    const res = await fetch(`${apiUrl}/v1/fragments/${fragmentId}.${targetType}`, {
      headers: user.authorizationHeaders(),
    });

    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`);
    }

    const contentType = res.headers.get('Content-Type');
    // if returns image
    if (contentType && contentType.startsWith('image/')) {
      // Handle binary image data
      const blob = await res.blob();
      console.log('Converted image Blob received:', blob);

      const imgElement = document.createElement('img');
      // Generates a URL for the Blob
      imgElement.src = URL.createObjectURL(blob);
      console.log('Converted image element created with src:', imgElement.src);

      return imgElement;
    } else {
      // Handle text or other types of data
      const data = await res.text();
      console.log('Fragment successfully converted', { data, type: contentType });
      return data;
    }
  } catch (err) {
    console.error('Failed to convert fragment (GET /v1/fragment/:id.ext)', { err });
    return null;
  }
}

export async function createFragment(user, type, data) {
  console.log('Creating a new fragment...');

  const fragmentCreateStatus = document.querySelector('#fragmentCreateStatus');
  // const Message = fragmentCreateStatus.querySelector('.status-message');
  const Message = fragmentCreateStatus.querySelector('#createFragmentStatus');

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
    Message.innerHTML = 'Fragment created successfully!';
    Message.style.color = 'green';

    const response = await res.json();
    console.log('Successfully created fragment', { response });
    return response;
  } catch (err) {
    // Assign Fail message
    Message.innerHTML = `Failed to create fragment: ${err.message}.<br />Your input type or input type format may not be acceptable.`;
    Message.style.color = 'red';

    console.error('Unable to create fragment', { err });
    return null;
  }
}

export async function updateFragment(user, fragmentId, updatedType, updatedData) {
  console.log(`Updating fragment with id ${fragmentId}...`);

  try {
    const res = await fetch(`${apiUrl}/v1/fragments/${fragmentId}`, {
      method: 'PUT',
      headers: {
        ...user.authorizationHeaders(),
        'Content-Type': updatedType,
      },
      body: updatedData,
    });

    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`);
    }

    const response = await res.json();
    console.log('Successfully updated fragment', { response });
    return response;
  } catch (err) {
    console.error('Unable to update fragment', { err });
    return null;
  }
}

export async function deleteFragment(user, fragmentId) {
  console.log(`Deleting fragment with ID: ${fragmentId}...`);
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
      deleteButton.style.marginRight = '5px';

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
      updateButton.style.marginRight = '5px';

      // Add event listener to the update button to open the modal for updating
      updateButton.addEventListener('click', () => {
        openUpdateModal(fragment);
      });

      // Create a convert button
      const convertButton = document.createElement('button');
      convertButton.textContent = 'View & Convert';
      convertButton.addEventListener('click', () => {
        openConvertModal(fragment);
      });

      // Append the delete, update button, and fragment list to the unordered list element
      fragmentItem.appendChild(deleteButton);
      fragmentItem.appendChild(updateButton);
      fragmentItem.appendChild(convertButton);
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

// Open the update fragment modal and assign event listener to update modal form elements
export function openUpdateModal(fragment) {
  const modal = document.querySelector('#updateFragmentModal');
  // Use flex to center the modal
  modal.style.display = 'flex';

  // Get modal form elements
  const fragmentFileInputM = document.querySelector('#fragmentFileM');
  const fragmentDataInputM = document.querySelector('#fragmentDataM');
  const fragmentTypeInputM = document.querySelector('#fragmentTypeM');
  const statusMessage = document.querySelector('#updateFragmentStatus');

  fragmentFileInputM.value = '';
  fragmentDataInputM.value = '';
  fragmentDataInputM.disabled = false;
  // Pre-defined the fragment type input as original one
  fragmentTypeInputM.value = fragment.type;
  // Clear any previous status messages
  statusMessage.innerHTML = '';

  let updatedData = '';

  // Regulate the input fields based on the file input
  // Set up event listeners for dynamic adjustments (modification
  // after open the modal)
  fragmentFileInputM.addEventListener('change', () => {
    if (fragmentFileInputM.files.length > 0) {
      fragmentDataInputM.required = false;
      fragmentDataInputM.disabled = true;
      fragmentDataInputM.value = '';
      updatedData = fragmentFileInputM.files[0];

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
      updatedData = fragmentDataInputM.value;
    }
  });

  // Once text input field change, update the updatedData
  fragmentDataInputM.addEventListener('input', () => {
    if (!fragmentDataInputM.disabled) {
      updatedData = fragmentDataInputM.value;
    }
  });

  fragmentTypeInputM.addEventListener('input', () => {
    fragmentTypeInputM.style.color = '';
  });

  // Update the fragment's data
  const updateForm = document.querySelector('#updateFragmentForm');
  updateForm.onsubmit = async (event) => {
    event.preventDefault();

    const user = await getUser();

    console.log(
      `Update fragment form inputs: fragmentId=${fragment.id} data=${updatedData} type=${fragmentTypeInputM.value}`
    );
    const response = await updateFragment(user, fragment.id, fragmentTypeInputM.value, updatedData);
    if (response) {
      // Close modal after successful update
      modal.style.display = 'none';

      const updatedFragments = await getUserFragments(user);
      displayFragments(updatedFragments.fragments);
    } else {
      console.error('Failed to update the fragment.');

      // Display failure message
      statusMessage.innerHTML =
        "Failed to update the fragment, please try again.<br /> Make sure you do not change the fragment's original type.";
      statusMessage.style.color = 'red';
    }
  };
}

// Open the convert fragment modal and assign event listener to convert modal form elements
export async function openConvertModal(fragment) {
  const modal = document.querySelector('#convertFragmentModal');
  modal.style.display = 'flex';

  // Pre-fill the modal with the fragment data
  const originalFragmentData = document.querySelector('#originalFragmentData');
  const convertedFragmentData = document.querySelector('#convertedFragmentData');
  const conversionMessage = document.querySelector('#conversionMessage');
  const conversionTypeInput = document.querySelector('#conversionType');

  // Clear any previous original data
  originalFragmentData.textContent = '';
  // Clear any previous type input
  conversionTypeInput.value = '';
  // Clear any previous conversion data
  convertedFragmentData.textContent = '';
  // Clear any previous status messages
  conversionMessage.innerHTML = '';

  try {
    const user = await getUser();
    const originalData = await getFragmentData(user, fragment.id);

    // Display the fragment's original data
    if (originalData instanceof HTMLElement) {
      originalFragmentData.appendChild(originalData);
    } else {
      originalFragmentData.textContent = originalData || 'No data available';
    }

    // Assign event listener to the convert button
    const convertButton = document.querySelector('#ConvertFragmentBtn');
    convertButton.onclick = async () => {
      // Requires target type input
      if (!conversionTypeInput.value) {
        conversionMessage.innerHTML = 'Please input a conversion type.';
        conversionMessage.style.color = 'red';
        return;
      }

      // Clear previous append image child before convert for the convertFragmentData span
      while (convertedFragmentData.firstChild) {
        convertedFragmentData.removeChild(convertedFragmentData.firstChild);
      }

      const convertedData = await convertFragment(user, fragment.id, conversionTypeInput.value);

      if (convertedData) {
        if (convertedData instanceof HTMLElement) {
          // It's an image element, append it to container
          convertedFragmentData.appendChild(convertedData);
        } else {
          convertedFragmentData.textContent = convertedData;
        }
        conversionMessage.innerHTML = 'Conversion successful!';
        conversionMessage.style.color = 'green';
      } else {
        conversionMessage.innerHTML =
          'Failed to convert fragment, please try again.<br />Note: The original type may not support conversion to the target type.';
        conversionMessage.style.color = 'red';
      }
    };
  } catch (err) {
    console.log(err);
  }
}
