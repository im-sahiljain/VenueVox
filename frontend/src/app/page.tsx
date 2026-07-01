"use client";

import React from "react";
import Link from "next/link";
import {
  Calendar,
  Compass,
  Shield,
  Zap,
  Music,
  Beer,
  Hotel,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Navigation */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-rose-500 text-white p-2 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              Stage<span className="text-rose-500">Hub</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login?role=performer"
              className="text-sm font-semibold text-slate-600 hover:text-slate-900"
            >
              For Performers
            </Link>
            <Link
              href="/login?role=organization"
              className="text-sm font-semibold text-slate-600 hover:text-slate-900"
            >
              For Venues
            </Link>
            <Button asChild className="rounded-full cursor-pointer bg-primary text-white hover:bg-rose-600">
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-white pt-20 pb-24 overflow-hidden border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-center">
            <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
              <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-rose-50 text-rose-600">
                Airbnb meets Calendly for Gigs
              </span>
              <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
                The availability-first platform for booking
                <span className="block text-rose-500 mt-2">
                  live entertainment
                </span>
              </h1>
              <p className="mt-6 text-lg text-slate-500 sm:mt-8">
                Venues post direct, bookable calendar slots. Artists find
                matches, request dates, and secure gigs in a single streamlined
                workflow. No social feeds. No spam. Just live music and
                performances.
              </p>

              <div className="mt-10 sm:flex sm:justify-center lg:justify-start gap-4">
                <Button asChild className="w-full sm:w-auto bg-slate-900 text-white hover:bg-slate-800 font-semibold py-6 rounded-xl shadow-md cursor-pointer">
                  <Link href="/login?role=organization">Manage Your Venues</Link>
                </Button>
                <Button asChild variant="outline" className="w-full sm:w-auto mt-4 sm:mt-0 text-slate-755 border-slate-350 font-semibold py-6 rounded-xl shadow-sm cursor-pointer">
                  <Link href="/login?role=performer">Find Available Slots</Link>
                </Button>
              </div>
            </div>

            <div className="mt-16 sm:mt-24 lg:mt-0 lg:col-span-6">
              <div className="bg-slate-100 rounded-3xl p-4 shadow-xl border border-slate-200/50">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                  <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                    <div>
                      <h3 className="font-bold text-slate-800">
                        Sector 17 Brew & Cafe
                      </h3>
                      <p className="text-xs text-slate-400">
                        1024 Market St, Cityville
                      </p>
                    </div>
                    <span className="bg-emerald-50 text-emerald-700 text-xs px-2.5 py-1 rounded-full font-semibold">
                      ₹150/Gig
                    </span>
                  </div>
                  <div className="py-4 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Date</span>
                      <span className="font-medium text-slate-800">
                        Friday, July 3rd
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Time</span>
                      <span className="font-medium text-slate-800">
                        06:00 PM - 09:00 PM
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Equipment Provided</span>
                      <span className="font-medium text-slate-800">
                        Acoustic Amp, 2x Vocal Mics
                      </span>
                    </div>
                  </div>
                  <Button className="w-full bg-rose-500 hover:bg-rose-600 text-white font-semibold py-6 rounded-xl shadow cursor-pointer">
                    Request Booking
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">
              Engineered for seamless live bookings
            </h2>
            <p className="mt-4 text-lg text-slate-500">
              We bypassed the noise of traditional social platforms to deliver a
              productivity-focused dashboard designed for high-volume
              reservations.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
              <div className="bg-rose-50 text-rose-600 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Calendar Availability
              </h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Venues define open blocks, recurring slots, or blocked-out
                wedding dates. Performers scan dates that match their calendar.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
              <div className="bg-rose-50 text-rose-600 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Advanced Filtering
              </h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Filter by venue types (Hotel, Brewery, Cafe), budgets, travel
                radius, genres, and exact technical equipment requirements.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
              <div className="bg-rose-50 text-rose-600 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Direct Messaging
              </h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Chat directly with organizations once you request a booking.
                Sync on equipment setup, soundcheck, and payment terms.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center sm:flex sm:justify-between sm:items-center">
          <div className="flex justify-center items-center gap-2 mb-4 sm:mb-0">
            <div className="bg-rose-500 text-white p-1.5 rounded-lg">
              <Calendar className="w-4 h-4" />
            </div>
            <span className="text-white font-bold text-lg">StageHub</span>
          </div>
          <p className="text-sm">
            &copy; {new Date().getFullYear()} StageHub, Inc. All rights
            reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
