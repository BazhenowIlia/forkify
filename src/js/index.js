import Search from './models/Search';
import Recipe from './models/Recipe';
import List from './models/List';
import Likes from './models/Likes';

import * as searchView from './views/Searchview';
import * as recipeView from './views/Recipeview';
import * as listView from './views/Listview';
import * as likeView from './views/Likesview';

import { elements, renderLoader, clearLoader } from './views/Base';

/* Global state of the app 
* - Search object
* - Current recipe object
* - Shopping list object
* - Liked recipes
*/

const state = {};
/* ================
  SEARCH CONTROLLER
================= */


const controlSearch = async () => {
  // 1. Get query from view
  const query = searchView.getInput();
  
  if (query) {
    // 2. New search object and add to state
    state.search = new Search(query);

    // 3. Preparing user interface
    searchView.clearInput();
    searchView.clearResults();
    renderLoader(elements.searchRes);
    try {
        // 4. Search for recipes
        await state.search.getResults();

        // 5. Render results on UI afte we recieve data
        clearLoader();
        searchView.renderResults(state.search.result);
    } catch(error) {
      console.log(error);
       alert('Something went wrong :(');
    }
  }
};


elements.searchForm.addEventListener('submit', e => {
  e.preventDefault();
  controlSearch();
});

// TESTING

// window.addEventListener('load', e => {
//   e.preventDefault();
//   controlSearch();
// });

elements.searchResPages.addEventListener('click', e => {
  const button = e.target.closest('.btn-inline');
  if (button) {
    const goToPage = parseInt(button.dataset.goto, 10);
    searchView.clearResults();
    searchView.renderResults(state.search.result, goToPage);
  }
});

/* ================
  RECIPE CONTROLLER
================= */

const controlRecipe = async () => {
  const id = window.location.hash.replace('#', '');
  
  if (id)   {
    // Prepare UI for changes
    renderLoader(elements.recipe);

    // Highlight selected
    if(state.search) searchView.hightlightSelected(id);

    // Creating Recipe object
    state.recipe = new Recipe(id)

    //  TESTING
    window.r = state.recipe;
    

    try {
        // Getting Recipe data
        await state.recipe.getRecipe();
        state.recipe.parseIngredients();
        
        // Calculate time and servings
        state.recipe.calcTime(); 
        state.recipe.calcServing()

        // Render recipe
        recipeView.clearRecipe();
        clearLoader();
        recipeView.renderRecipe(
          state.recipe,
          state.likes.isLiked(id)
        );

    } catch (error) {
        console.log(error);
        alert('Error processing recipe'); 
        clearLoader(state.recipe);
    }
  }
};

// window.addEventListener('hashchange', controlRecipe);
// window.addEventListener('load', controlRecipe);
['hashchange', 'load'].forEach(event => window.addEventListener(event, controlRecipe));


/* ===================================
            LIST CONTROLLER
====================================== */

const controlList = () => {
  // Create new list if there is none
  if(!state.list) state.list = new List();  

  // Add each ingredient to the list
  state.recipe.ingredients.forEach(el => {
    const item = state.list.additem(el.count, el.unit, el.ingredient);
    listView.renderItem(item);
  })
}

/* ===================================
            LIKES CONTROLLER
====================================== */

// ----------------- TESTING ------------------
state.likes = new Likes();
likeView.toggleLikesMenu(state.likes.getNumLikes());

// --------------------------------------------
const controlLikes = () => {
  // Add likes object to state if there is none
  if (!state.likes) state.likes = new Likes();
  const currendID = state.recipe.id;

  // Check items array
  if (!state.likes.isLiked(currendID)) {
    // Add item if not in array
    
    const newLike = state.likes.addLike (
      state.recipe.id, 
      state.recipe.title, 
      state.recipe.author, 
      state.recipe.img
    );

    // Toggle the like button
    likeView.toggleLikeBtn(true);

    //Render like item
    likeView.renderLike(newLike);

    // Remove item if in list
  } else {
    //delete like from likes array
    state.likes.deleteLike(currendID); 

    // delete recipe from likes menu
    likeView.removeLike(currendID);

    // Remove like button from active state
    likeView.toggleLikeBtn(false);

    
  }

  // Toggle the like menu
  likeView.toggleLikesMenu(state.likes.getNumLikes());
} 



/* ===================================
            EVENT LISTENERS
====================================== */

// Restore likes recipes on page load

window.addEventListener('load', () => {
  // Create object
  state.likes = new Likes();

  // Add data from storage to state.likes
  state.likes.readStorage();

  // Render the like menu button
  likeView.toggleLikesMenu(state.likes.getNumLikes());

  // Render the existing likes
  state.likes.likes.forEach(el => likeView.renderLike(el));
})
  

// Recipe event listeners 
elements.recipe.addEventListener('click', e => {
  if (e.target.matches('.btn-decrease, .btn-decrease *')) {
    if (state.recipe.servings > 1) {
      state.recipe.updateServings('dec'); 
      recipeView.updateServingsIngredients(state.recipe);
    }
  } else if (e.target.matches('.btn-increase, .btn-increase *')) {
      state.recipe.updateServings('inc');  
      recipeView.updateServingsIngredients(state.recipe);
  } else if (e.target.matches('.recipe__btn--add, .recipe__btn--add *')) {
      controlList();
  } else if (e.target.closest('.recipe__love, recipe__love *')) {
      controlLikes();
  } 
}) 

// Shopping list event listeners
elements.shopping.addEventListener('click', e => {
  const id = e.target.closest('.shopping__item').dataset.itemid;

  // Handle the delete button

  if(e.target.matches('.shopping__delete, .shopping__delete *')) {
    // Delete from state
    state.list.deleteItem(id);

    // Delete from UI
      listView.deleteItem(id);
  }
    else if (e.target.matches('.shopping__count--value')) {
      const val = parseFloat(e.target.value, 10);
      state.list.updateCount(id, val);
  }
})

