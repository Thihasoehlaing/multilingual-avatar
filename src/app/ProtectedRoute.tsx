import { Navigate } from "react-router-dom";
import type { ReactElement } from "react";
import { useAppSelector } from "@/store/hooks";
import { selectIsAuthed } from "@/store/auth.slice";

export function ProtectedRoute({ children }: { children: ReactElement }) {
  const isAuthed = useAppSelector(selectIsAuthed);
  if (!isAuthed) return <Navigate to="/login" replace />;
  return children;
}
