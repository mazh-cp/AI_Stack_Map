-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "environment" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "updatedAt" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "SecurityControl" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "layer" TEXT NOT NULL,
    "mitigates" TEXT NOT NULL,
    "owasp" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "evidenceLink" TEXT,
    "notes" TEXT,
    "weight" INTEGER NOT NULL,
    "positionX" REAL,
    "positionY" REAL,
    "vendor" TEXT,
    "integrationId" TEXT
);

-- CreateTable
CREATE TABLE "Risk" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "layer" TEXT NOT NULL,
    "owasp" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "likelihood" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "controls" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Incident" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "layer" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "detectedAt" TEXT NOT NULL,
    "relatedRisk" TEXT
);

-- CreateTable
CREATE TABLE "ComplianceMapping" (
    "owasp" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "framework" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Evidence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "controlId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "addedBy" TEXT NOT NULL,
    "addedAt" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Integration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "vendor" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "apiBaseUrl" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL,
    "authMethod" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "lastHealthCheck" TEXT NOT NULL,
    "supportedLayers" TEXT NOT NULL,
    "mock" BOOLEAN NOT NULL
);

-- CreateTable
CREATE TABLE "ModelCoverage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "deploymentType" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "environment" TEXT NOT NULL,
    "sensitivity" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "useCase" TEXT NOT NULL,
    "allowedTools" TEXT NOT NULL,
    "inputGuardrailsEnabled" BOOLEAN NOT NULL,
    "outputGuardrailsEnabled" BOOLEAN NOT NULL,
    "toolAccessEnabled" BOOLEAN NOT NULL,
    "loggingEnabled" BOOLEAN NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "localRuntime" TEXT,
    "internal" BOOLEAN,
    "internetAccess" BOOLEAN,
    "networkIsolated" BOOLEAN,
    "localDataAccess" BOOLEAN,
    "modelIntegrityVerified" BOOLEAN,
    "serverLocation" TEXT
);

-- CreateTable
CREATE TABLE "FileScan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "fileHash" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "scanProvider" TEXT NOT NULL,
    "verdict" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "submittedAt" TEXT NOT NULL,
    "completedAt" TEXT,
    "rawEvidence" TEXT,
    "blockedFromRetrieval" BOOLEAN NOT NULL
);

-- CreateTable
CREATE TABLE "PromptInspection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "modelId" TEXT,
    "provider" TEXT NOT NULL,
    "promptHash" TEXT NOT NULL,
    "riskScore" INTEGER NOT NULL,
    "categories" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "inspectedAt" TEXT NOT NULL,
    "rawEvidence" TEXT,
    "stage" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
