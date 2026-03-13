import { api } from "../../convex/_generated/api";
import { useConvex } from "convex/react";
import { Id } from "../../convex/_generated/dataModel";

export interface UploadResult {
  downloadUrl: string;
  fileName: string;
  fileId: Id<"files">;
}

export const uploadFile = async (
  file: File,
  path: string,
  userId: Id<"users">,
  chatId?: Id<"chats"> | undefined
): Promise<UploadResult> => {
  const convex = useConvex();
  
  try {
    // Step 1: Get a pre-signed URL for upload
    const uploadUrlResult = await convex.mutation(api.chat.storage.generateUploadUrl, { fileSize: file.size });
    
    if (!uploadUrlResult.success) {
      throw new Error(`Failed to get upload URL: Not enough storage space. Space needed: ${uploadUrlResult.spaceNeeded} bytes.`);
    }
    
    // Step 2: Upload the file directly to Convex storage
    const response = await fetch(uploadUrlResult.url, {
      method: "POST",
      headers: {
        "Content-Type": file.type,
      },
      body: file,
    });
    
    if (!response.ok) {
      throw new Error(`Failed to upload file: ${response.statusText}`);
    }
    
    // Step 3: Get the storageId from the response
    const { storageId } = await response.json();
    
    // Step 4: Save the file metadata in the database
    const fileMetadata: any = {
      storageId,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      userId,
      path,
    };
    
    // Only add chatId if it's defined
    if (chatId) {
      fileMetadata.chatId = chatId;
    }
    
    const result = await convex.mutation(api.chat.storage.saveFileMetadata, fileMetadata);
    
    return {
      downloadUrl: result.url,
      fileName: file.name,
      fileId: result._id,
    };
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
};

export const getFileUrl = async (fileId: Id<"files">): Promise<string | null> => {
  const convex = useConvex();
  return await convex.query(api.chat.storage.getFileUrl, { fileId });
};

export const findFileByPath = async (path: string, userId: Id<"users">): Promise<Id<"files"> | null> => {
  const convex = useConvex();
  return await convex.query(api.chat.storage.findFileByPath, { path, userId });
};

export const findFileByStorageId = async (storageId: string): Promise<Id<"files"> | null> => {
  const convex = useConvex();
  return await convex.query(api.chat.storage.findFileByStorageId, { storageId });
};

export const findFileByUrl = async (url: string): Promise<Id<"files"> | null> => {
  const convex = useConvex();
  return await convex.query(api.chat.storage.findFileByUrl, { url });
};

export const deleteFile = async (fileId: Id<"files">, userId: Id<"users">): Promise<boolean> => {
  const convex = useConvex();
  return await convex.mutation(api.chat.storage.deleteFile, { fileId });
};

export const hasActiveReports = async (fileId: Id<"files">): Promise<boolean> => {
  const convex = useConvex();
  return await convex.query(api.chat.storage.hasActiveReports, { fileId });
};

// Hook version for use in React components
export const useConvexStorage = () => {
  const convex = useConvex();
  
  const uploadFileToConvex = async (
    file: File,
    path: string,
    userId: Id<"users">,
    chatId: Id<"chats"> | undefined,
    onProgress?: (progress: number) => void
  ): Promise<UploadResult> => {
    let storageId: Id<"_storage">;
    try {
      // Step 1: Get a pre-signed URL for upload
      const uploadUrlResult = await convex.mutation(api.chat.storage.generateUploadUrl, { fileSize: file.size });
      
      if (!uploadUrlResult.success) {
        throw new Error(`Failed to get upload URL: Not enough storage space. Space needed: ${uploadUrlResult.spaceNeeded} bytes.`);
      }
      
      // Step 2: Upload the file directly to Convex storage using XMLHttpRequest
      const response = await new Promise<any>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", uploadUrlResult.url, true);
        xhr.setRequestHeader("Content-Type", file.type);

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable && onProgress) {
            const progress = Math.round((event.loaded / event.total) * 100);
            onProgress(progress);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error(`Failed to upload file: ${xhr.statusText}`));
          }
        };

        xhr.onerror = () => {
          reject(new Error("Network error during file upload."));
        };

        xhr.send(file);
      });
      
      storageId = response.storageId;
      
      // Step 4: Save the file metadata in the database
      const fileMetadata: any = {
        storageId,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        userId,
        path,
      };
      
      // Only add chatId if it's defined
      if (chatId) {
        fileMetadata.chatId = chatId;
      }
      
      const result = await convex.mutation(api.chat.storage.saveFileMetadata, fileMetadata);
      
      // Final progress update to 100%
      if (onProgress) {
        onProgress(100);
      }
      
      return {
        downloadUrl: result.url,
        fileName: file.name,
        fileId: result._id,
      };
    } catch (error) {
      console.error("Error uploading file:", error);
      throw error;
    }
  };
  
  const getFileUrlFromConvex = async (fileId: Id<"files">): Promise<string | null> => {
    return await convex.query(api.chat.storage.getFileUrl, { fileId });
  };
  
  const findFileByPathFromConvex = async (path: string, userId: Id<"users">): Promise<Id<"files"> | null> => {
    return await convex.query(api.chat.storage.findFileByPath, { path, userId });
  };
  
  const findFileByStorageIdFromConvex = async (storageId: string): Promise<Id<"files"> | null> => {
    return await convex.query(api.chat.storage.findFileByStorageId, { storageId });
  };
  
  const findFileByUrlFromConvex = async (url: string): Promise<Id<"files"> | null> => {
    return await convex.query(api.chat.storage.findFileByUrl, { url });
  };
  
  const deleteFileFromConvex = async (fileId: Id<"files">, userId: Id<"users">): Promise<boolean> => {
    return await convex.mutation(api.chat.storage.deleteFile, { fileId });
  };
  
  const hasActiveReportsForFile = async (fileId: Id<"files">): Promise<boolean> => {
    return await convex.query(api.chat.storage.hasActiveReports, { fileId });
  };
  
  return {
    uploadFile: uploadFileToConvex,
    getFileUrl: getFileUrlFromConvex,
    findFileByPath: findFileByPathFromConvex,
    findFileByStorageId: findFileByStorageIdFromConvex,
    findFileByUrl: findFileByUrlFromConvex,
    deleteFile: deleteFileFromConvex,
    hasActiveReports: hasActiveReportsForFile,
  };
};
 

