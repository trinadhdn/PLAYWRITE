# Install the packages

npm install

# To install the browsers

npx playwright install

# To run the test cases

npx playwright test "path_to_the_test_spec_file"

# Note

The test spec file name should always end like ".spec.js"

# Pre-requisites
1) We need Callisto eye device simulator set up and running in the Direct Linux hosted CM VM
2) We need hyperv hosted CM VMs and their variable names(for Dev environment) are - dev_hypervDeviceId, dev_proxyDeviceId, dev_activationKeyHypervDeviceId in the pipeline
The device for the dev_activationKeyHypervDeviceId need not be in running state.



