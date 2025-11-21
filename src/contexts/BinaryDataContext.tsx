import { createContext, useContext, useState, ReactNode } from "react";

interface BinaryDataContextType {
  binaryData: Uint8Array;
  setBinaryData: (data: Uint8Array) => void;
  assemblyCode: string;
  setAssemblyCode: (code: string) => void;
  orgValue: number;
  setOrgValue: (value: number) => void;
}

const BinaryDataContext = createContext<BinaryDataContextType | undefined>(undefined);

export const BinaryDataProvider = ({ children }: { children: ReactNode }) => {
  const [binaryData, setBinaryData] = useState<Uint8Array>(() => new Uint8Array(65536));
  const [assemblyCode, setAssemblyCode] = useState<string>("");
  const [orgValue, setOrgValue] = useState<number>(0);

  return (
    <BinaryDataContext.Provider value={{ binaryData, setBinaryData, assemblyCode, setAssemblyCode, orgValue, setOrgValue }}>
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
