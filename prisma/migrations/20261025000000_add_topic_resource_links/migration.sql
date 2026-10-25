CREATE TABLE "ResourceLink" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "description" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ResourceLink_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ResourceLink_topicId_position_idx" ON "ResourceLink"("topicId", "position");

ALTER TABLE "ResourceLink"
ADD CONSTRAINT "ResourceLink_topicId_fkey"
FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
