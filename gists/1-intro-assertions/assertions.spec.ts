await expect(page.getByRole('listitem')).toHaveCount(20)   // green
await expect(page.getByText(/relevance/i)).toBeVisible()   // green
await expect(page).toHaveScreenshot('search.png')          // green-ish, you marked it as updateSnapshots last week
