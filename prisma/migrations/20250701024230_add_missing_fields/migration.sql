-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'PARTIAL');

-- CreateEnum
CREATE TYPE "ImportStatus" AS ENUM ('PENDING', 'IMPORTING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "SyncAction" AS ENUM ('ADD_TRACK', 'REMOVE_TRACK', 'CREATE_PLAYLIST', 'UPDATE_PLAYLIST', 'SEARCH_TRACK');

-- AlterTable
ALTER TABLE "Playlist" ADD COLUMN "position" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Song" ADD COLUMN "bpm" INTEGER;

-- CreateTable
CREATE TABLE "PlaylistSync" (
    "id" TEXT NOT NULL,
    "playlistId" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "externalId" TEXT,
    "status" "SyncStatus" NOT NULL DEFAULT 'PENDING',
    "lastSyncAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "conflictCount" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "totalCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlaylistSync_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncLog" (
    "id" TEXT NOT NULL,
    "syncId" TEXT NOT NULL,
    "songId" TEXT,
    "action" "SyncAction" NOT NULL,
    "status" "SyncStatus" NOT NULL,
    "errorMessage" TEXT,
    "spotifyUri" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SyncLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "playlistId" TEXT,
    "spotifyPlaylistId" TEXT NOT NULL,
    "playlistName" TEXT NOT NULL,
    "totalTracks" INTEGER NOT NULL,
    "importedTracks" INTEGER NOT NULL,
    "status" "ImportStatus" NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImportHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Playlist_userId_position_idx" ON "Playlist"("userId", "position");

-- CreateIndex
CREATE INDEX "Song_bpm_idx" ON "Song"("bpm");

-- CreateIndex
CREATE INDEX "PlaylistSync_playlistId_idx" ON "PlaylistSync"("playlistId");

-- CreateIndex
CREATE INDEX "PlaylistSync_platform_idx" ON "PlaylistSync"("platform");

-- CreateIndex
CREATE INDEX "PlaylistSync_status_idx" ON "PlaylistSync"("status");

-- CreateIndex
CREATE UNIQUE INDEX "PlaylistSync_playlistId_platform_key" ON "PlaylistSync"("playlistId", "platform");

-- CreateIndex
CREATE INDEX "SyncLog_syncId_idx" ON "SyncLog"("syncId");

-- CreateIndex
CREATE INDEX "SyncLog_songId_idx" ON "SyncLog"("songId");

-- CreateIndex
CREATE INDEX "SyncLog_status_idx" ON "SyncLog"("status");

-- CreateIndex
CREATE INDEX "ImportHistory_userId_idx" ON "ImportHistory"("userId");

-- CreateIndex
CREATE INDEX "ImportHistory_spotifyPlaylistId_idx" ON "ImportHistory"("spotifyPlaylistId");

-- CreateIndex
CREATE INDEX "ImportHistory_status_idx" ON "ImportHistory"("status");

-- CreateIndex
CREATE INDEX "ImportHistory_startedAt_idx" ON "ImportHistory"("startedAt");

-- AddForeignKey
ALTER TABLE "PlaylistSync" ADD CONSTRAINT "PlaylistSync_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "Playlist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyncLog" ADD CONSTRAINT "SyncLog_syncId_fkey" FOREIGN KEY ("syncId") REFERENCES "PlaylistSync"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyncLog" ADD CONSTRAINT "SyncLog_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportHistory" ADD CONSTRAINT "ImportHistory_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "Playlist"("id") ON DELETE SET NULL ON UPDATE CASCADE;