import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";

const secretsClient = new SecretsManagerClient({
  region: "us-east-1",
});



export async function getSecret<T>(
  secretId: string
): Promise<T> {
  const command = new GetSecretValueCommand({
    SecretId: secretId,
  });

  const response = await secretsClient.send(command);

  if (!response.SecretString) {
    throw new Error("SecretString is empty");
  }

  return JSON.parse(response.SecretString);
}

