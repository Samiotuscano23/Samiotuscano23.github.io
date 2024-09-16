// Array to store added meals
var meals = [];

// Function to add a meal
function addMeal() {
    var query = document.getElementById('query').value;
    if (query) {
        meals.push(query);
        displayMeals();
    }
}

// Function to remove a meal
function removeMeal(index) {
    meals.splice(index, 1);
    displayMeals(); // Refresh the meal list
}

// Function to display the added meals
function displayMeals() {
    var mealsTable = '<h3>Added Meals:</h3><table><tr><th>Meal</th><th>Calories</th><th>Action</th></tr>';
    meals.forEach(function (meal, index) {
        $.ajax({
            method: 'GET',
            url: 'https://api.api-ninjas.com/v1/nutrition?query=' + meal,
            headers: { 'X-Api-Key': 'XjvIriwuXhhYAVJrlBKtXw==VJYsoykIgPe6Ci73' },
            contentType: 'application/json',
            success: function (result) {
                var identifier = 'meal_' + index;
                mealsTable += `<tr id="${identifier}"><td>${meal}</td><td>${result[0].calories}</td><td><button onclick="removeMeal(${index})">Remove</button></td></tr>`;
                document.getElementById('mealsContainer').innerHTML = mealsTable;
            },
            error: function (jqXHR) {
                console.error('Error: ', jqXHR.responseText);
            }
        });
    });
}

// Function to calculate total calories and other nutritional values
function findCalories() {
    var totalCalories = 0;
    var combinedNutritionalValues = {
        serving_size_g: 0,
        carbohydrates_total_g: 0,
        cholesterol_mg: 0,
        fat_saturated_g: 0,
        fat_total_g: 0,
        fiber_g: 0,
        potassium_mg: 0,
        protein_g: 0,
        sodium_mg: 0,
        sugar_g: 0
    };

    meals.forEach(function (meal, index) {
        $.ajax({
            method: 'GET',
            url: 'https://api.api-ninjas.com/v1/nutrition?query=' + meal,
            headers: { 'X-Api-Key': 'XjvIriwuXhhYAVJrlBKtXw==VJYsoykIgPe6Ci73' },
            contentType: 'application/json',
            success: function (result) {
                totalCalories += result[0].calories;

                // Aggregate nutritional values
                Object.keys(combinedNutritionalValues).forEach(function (key) {
                    combinedNutritionalValues[key] += result[0][key];
                });

                // Update the UI
                updateHtmlWithApiData(totalCalories, combinedNutritionalValues);
            },
            error: function (jqXHR) {
                console.error('Error: ', jqXHR.responseText);
            }
        });
    });
}

// Function to update the HTML with nutritional data
function updateHtmlWithApiData(totalCalories, combinedNutritionalValues) {
    document.getElementById('caloriesBurn').innerText = totalCalories;

    var nutritionalList = document.getElementById('nutritionalValuesList');
    nutritionalList.innerHTML = `
        <li>Total Serving Size: ${combinedNutritionalValues.serving_size_g} g</li>
        <li>Total Carbohydrates: ${combinedNutritionalValues.carbohydrates_total_g} g</li>
        <li>Total Cholesterol: ${combinedNutritionalValues.cholesterol_mg} mg</li>
        <li>Total Saturated Fat: ${combinedNutritionalValues.fat_saturated_g} g</li>
        <li>Total Fat: ${combinedNutritionalValues.fat_total_g} g</li>
        <li>Total Fiber: ${combinedNutritionalValues.fiber_g} g</li>
        <li>Total Potassium: ${combinedNutritionalValues.potassium_mg} mg</li>
        <li>Total Protein: ${combinedNutritionalValues.protein_g} g</li>
        <li>Total Sodium: ${combinedNutritionalValues.sodium_mg} mg</li>
        <li>Total Sugar: ${combinedNutritionalValues.sugar_g} g</li>
    `;

    // Update exercise list
    updateExerciseSuggestions(totalCalories);
}

// Function to display exercises to burn calories
function updateExerciseSuggestions(totalCalories) {
    var exercises = [
        { name: "Jog", time: Math.round(totalCalories / 378 * 60), image: "CalorieImages/running.png" },
        { name: "Do Power Yoga", time: Math.round(totalCalories / 223 * 60), image: "CalorieImages/yoga.png" },
        { name: "Get a Gym Workout", time: Math.round(totalCalories / 483 * 60), image: "CalorieImages/weightlifter.png" },
        { name: "Go for a Brisk Walk", time: Math.round(totalCalories / 294 * 60), image: "CalorieImages/walking.png" }
    ];

    var exerciseList = document.getElementById('exerciseList');
    exerciseList.innerHTML = '';
    exercises.forEach(function (exercise) {
        var exerciseDiv = document.createElement('div');
        exerciseDiv.classList.add('d-flex', 'align-items-center', 'mb-5');
        exerciseDiv.innerHTML = `
            <div class="flex-shrink-0">
                <img src="${exercise.image}" alt="${exercise.name}">
            </div>
            <div class="flex-grow-1 ms-3">
                <h5>${exercise.name}</h5>
                <p>You will need to ${exercise.name.toLowerCase()} for <strong>${exercise.time}</strong> minutes.</p>
            </div>
        `;
        exerciseList.appendChild(exerciseDiv);
    });
}
