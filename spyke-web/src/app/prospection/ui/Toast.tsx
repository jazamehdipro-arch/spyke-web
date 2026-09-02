"use client";

/** Le bandeau noir qui remonte du bas, repris du prototype. */
export default function Toast({ message }: { message: string }) {
  return <div className={"toast" + (message ? " show" : "")}>{message}</div>;
}
