"use client";

import { useState, useEffect } from "react";
import LandingGift from "./LandingGift";

const SESSION_KEY = "bonvie_greeted";

export default function LandingWrapper() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Show landing only once per browser session
    if (!sessionStorage.getItem(SESSION_KEY)) {
      setShow(true);
    }
  }, []);

  const handleEnter = () => {
    sessionStorage.setItem(SESSION_KEY, "1");
    setShow(false);
  };

  if (!show) return null;
  return <LandingGift onEnter={handleEnter} />;
}
