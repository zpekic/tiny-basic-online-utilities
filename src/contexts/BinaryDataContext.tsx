import { createContext, useContext, useState, ReactNode } from "react";

interface BinaryDataContextType {
  binaryData: Uint8Array;
  setBinaryData: (data: Uint8Array) => void;
}

const BinaryDataContext = createContext<BinaryDataContextType | undefined>(undefined);

export const BinaryDataProvider = ({ children }: { children: ReactNode }) => {
  const [binaryData, setBinaryData] = useState<Uint8Array>(() => new Uint8Array(65536));

  return (
    <BinaryDataContext.Provider value={{ binaryData, setBinaryData }}>
      {children}
    </BinaryDataContext.Provider>
  );
};

export const useBinaryData = () => {
  const context = useContext(BinaryDataContext);
  if (context === undefined) {
    throw new Error("useBinaryData must be used within a BinaryDataProvider");
  }
  return context;
};
