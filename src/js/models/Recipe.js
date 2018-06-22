import axios from 'axios';
import { key,proxy} from '../config';
import {join} from 'path';

export default class Recipe {
  constructor(id) {
    this.id = id;
  }

  async getRecipe() {

    try {
      const res = await axios(`${proxy}http://food2fork.com/api/get?key=${key}&rId=${this.id}`);
      this.title = res.data.recipe.title;
      this.author = res.data.recipe.publisher;
      this.img = res.data.recipe.image_url;
      this.url = res.data.recipe.source_url;
      this.ingredients = res.data.recipe.ingredients;
      console.log(res);
    } catch (error) {
      console.log(error);
      alert('Something went wrong :(')
    }
  };

  calcTime() {
    const numOfIng = this.ingredients.length;
    const periods = Math.ceil(numOfIng / 3);
    this.time = periods * 15;
  };

  calcServing() {
    this.servings = 4;
  };

  parseIngredients() {
    const unitsLong = ['tablespoons', 'tablespoon', 'ounces', 'ounce', 'teaspoons', 'teaspoon', 'cups', 'pounds'];
    const unitsShort = ['tbsp', 'tbsp', 'oz', 'oz', 'tsp', 'tsp', 'cup', 'pound'];
    const units = [...unitsShort, 'kg', 'grams'];

    const newIngredients = this.ingredients.map(el => {

      // 1. Uniform units
      let ingredient = el.toLowerCase();
      unitsLong.forEach((unit, i) => {
        ingredient = ingredient.replace(unit, unitsShort[i]);
      });

      // 2. Remoove parentheses
      ingredient = ingredient.replace(/ *\([^)]*\) */g, " ");


      // 3. Parse ingredients into count, unit and ingredient
      const arrIng = ingredient.split(' ');
      const unitIndex = arrIng.findIndex(el2 => unitsShort.includes(el2));

      // Cutting and evaluating measure for ingredien
      let objIng;
      if (unitIndex > -1) {
        const arrCount = arrIng.slice(0, unitIndex);

        let count;
        if (arrCount.length === 1) {
          count = eval(arrIng[0].replace('-', '+')); // rep  lacing - in some recepies
        } else {
          count = eval(arrIng.slice(0, unitIndex).join('+'));
        }

        objIng = {
          count, // Measure for unit
          unit: arrIng[unitIndex], // Unit itself
          ingredient: arrIng.slice(unitIndex + 1).join(' ') // Ingredient
        }

      } else if (parseInt(arrIng[0], 10)) {
        // There is no unit we specifiend in UNIT object, but first letter is a number
        objIng = {
          count: parseInt(arrIng[0], 10), // Converting number from string to number format
          unit: '',
          ingredient: arrIng.slice(1).join(' ') // Slicing all except the first number
        }

      } else if (unitIndex === -1) {
        // Adding 1 before each ingredient, so we can count all elements 
        objIng = {
          count: 1,
          unit: '',
          ingredient // Whole string without parentheses
        }
      }
      return objIng;
    });

    console.log(newIngredients);
    this.ingredients = newIngredients;
  };

  updateServings(type) {
    // Servings
    const newServings = type === 'dec'? this.servings - 1: this.servings + 1;

    //Ingredients
    this.ingredients.forEach(ing => {
      ing.count = ing.count * newServings/this.servings;
    });

    this.servings = newServings;
  };

}