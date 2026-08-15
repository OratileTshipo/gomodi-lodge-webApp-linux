CREATE INDEX "auth_otps_phone_consumed_idx" ON "auth_otps" USING btree ("phone","consumed");--> statement-breakpoint
CREATE INDEX "booking_requests_status_category_idx" ON "booking_requests" USING btree ("status","category");--> statement-breakpoint
CREATE INDEX "booking_room_lines_room_dates_idx" ON "booking_room_lines" USING btree ("room_id","check_in","check_out");--> statement-breakpoint
CREATE INDEX "reviews_status_idx" ON "reviews" USING btree ("status");--> statement-breakpoint
CREATE INDEX "staff_time_clocks_user_timestamp_idx" ON "staff_time_clocks" USING btree ("user_id","timestamp");