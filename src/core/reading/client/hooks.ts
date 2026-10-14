"use client";

import { useMutation } from "@tanstack/react-query";
import { useElysia } from "@/frontend/lib/eden";

/**
 * Client mutations for readings. Reads are RSC-driven (the reading page calls
 * the services directly), so these only start things: a reading, a checkout.
 */
export const useReadings = () => {
    const client = useElysia().readings;

    const useCreate = () => useMutation(client.post.mutationOptions());

    const useCheckout = (id: string) =>
        useMutation(client({ id }).checkout.post.mutationOptions());

    return { useCreate, useCheckout };
};
