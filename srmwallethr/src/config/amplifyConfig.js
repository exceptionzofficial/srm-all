/**
 * AWS Amplify Configuration for Face Liveness
 */

// AWS Credentials from environment/config
export const AWS_CONFIG = {
    region: 'ap-south-1',
    identityPoolId: 'ap-south-1:3d38d38c-a57d-4ab2-9bbc-e333f4e63b11',
};

/**
 * Configure AWS Amplify for Face Liveness
 * Note: AWS Amplify FaceLivenessDetector uses Cognito Identity Pool
 * for temporary credentials
 */
export const amplifyConfig = {
    Auth: {
        Cognito: {
            identityPoolId: AWS_CONFIG.identityPoolId,
            region: AWS_CONFIG.region,
            allowGuestAccess: true,
        },
    },
};

export default amplifyConfig;
